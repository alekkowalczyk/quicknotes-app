Notes = new Mongo.Collection("notes");
NotesOffline = new Mongo.Collection(null);
Tags = new Mongo.Collection("tags");
TagsOffline = new Mongo.Collection(null);
UserData = new Mongo.Collection("userdata");
UserDataOffline = new Mongo.Collection(null);

var MAX_TAGS = 25;
var MAX_NOTES_IMPORT = 25;
var MAX_NOTE_LENGTH = 7000; //Is defined also in client/components/Note.import.jsx

if (Meteor.isServer) {
    // Only publish tasks that are public or belong to the current user
    Meteor.publish("notes", function () {
        if(true){//this.userId) {
            return Notes.find({owner: this.userId},
                {
                    sort: {updatedAtForSort: -1}
                }
            );
        }
        else {
            return NotesOffline.find({}, { sort: {updatedAtForSort: -1}});
        }
    });
    Meteor.publish("tags", function () {
        if(true){//if(this.userId) {
            return Tags.find(
                {owner: this.userId}
            );
        }
        else {
            return TagsOffline.find();
        }
    });
    Meteor.publish("userdata", function() {
        if(true){//if(this.userId) {
            return UserData.find({
                owner: this.userId
            });
        }
        else{
            return UserDataOffline.find();
        }
    });
    //Picker.route('/export',  (params, req, res, next) => {
    //    let something = Meteor.call('test');
    //    console.log(CurrentUserId);
    //        let filename = 'quicknotes_export_'+(new Date()).toISOString().replace('-','').replace('.','').replace(':','')+'.json';
    //        let fileData = {
    //            userId: this.userId,
    //            notes: Notes.find().fetch(),
    //            tags: Tags.find().fetch()
    //        };
    //        res.setHeader('Content-type', 'text/json');
    //        res.setHeader('Content-Dispositions','attachment; filename='+filename)
    //        res.statusCode = 200;
    //        res.end(JSON.stringify(fileData));
    //    }
    //);


    //Router.route('export', {
    //    path: '/export',
    //    where: 'server',
    //    action: function () {
    //        console.log(Meteor.userId());
    //        let filename = 'quicknotes_export_'+(new Date()).toISOString().replace('-','').replace('.','').replace(':','')+'.json';
    //        let fileData = {
    //            notes: Notes.find({owner: this.userId}).fetch(),
    //            tags: Tags.find({owner: this.userId}).fetch()
    //        };
    //        let headers = {
    //            'Content-type' : 'text/json',
    //            'Content-Dispositions':'attachment; filename='+filename
    //        };
    //        this.response.writeHead(200, headers);
    //        return this.response.end(JSON.stringify(fileData));
    //    }
    //});

}

var mergeTags = (tagObj) =>{
    let tagsSource = Meteor.userId() ? Tags: TagsOffline;
    let existingTag = tagsSource.findOne({ $and: [ {owner: tagObj.owner}, {name: tagObj.name} ]});
    if(existingTag){//Merge subhashes
        let changed = false;
        let maxTagsExceeded = false;
        let checkFunction = (fromNote, fromExisting) =>{
            for(let subHash of fromNote.subHashes){
                let subHashFromExisting = fromExisting.subHashes.filter(sh => sh.name == subHash.name);
                if(subHashFromExisting.length == 0){
                    if(fromExisting.subHashes.length > MAX_TAGS){
                        maxTagsExceeded = true;
                        break;
                    }
                    fromExisting.subHashes.push(subHash);
                    changed = true;
                } else{
                    checkFunction(subHash, subHashFromExisting[0]);
                }
            };
        };
        checkFunction(tagObj, existingTag);
        if(maxTagsExceeded){
            return "MAX_TAGS";
        }
        if(changed){
            tagsSource.update( { name: existingTag.name}, existingTag);
            return "OK";
        }
    }else{
        let rootTagsCount = tagsSource.find({ owner: Meteor.userId() }).count();
        if(rootTagsCount > MAX_TAGS) {
            return "MAX_TAGS";
        }
        else{
            tagsSource.insert(tagObj);
            return "OK";
        }
    }

    let userDataSource = Meteor.userId() ? UserData : UserDataOffline;
    let userData = userDataSource.findOne({owner: Meteor.userId()});
    if(!userData) {
        changeRootTagOrder(tagsSource.find({owner: Meteor.userId()}).fetch().map(t=>t.name));
    }
};

var changeRootTagOrder = (tagsOrderArray) =>
{
    let userDataSource = Meteor.userId() ? UserData : UserDataOffline;
    userDataSource.update({ owner: Meteor.userId()}, {
        $set : { tagsOrder : tagsOrderArray }
    }, {
        upsert: true
    });
};

Meteor.methods({
    menuOpened(){
        let userDataSource = Meteor.userId() ? UserData : UserDataOffline;
        userDataSource.update({ owner: Meteor.userId()}, {
            $set : { menuOpened: true}
        }, {
            upsert: true
        });
    },
    changeRootTagOrder: changeRootTagOrder,
    changeSubTagOrder(parentTagName, subTagOrderArray) {
        let tagsSource = Meteor.userId() ? Tags: TagsOffline;
        let updateOrderForSubHashes = (tag) => {
            let newOrder = [];
            for(let i = 0; i< subTagOrderArray.length; i++)
            {
                let existingSubTag = tag.subHashes.find(t => t.name == subTagOrderArray[i]);
                if(existingSubTag) {
                    newOrder.push(existingSubTag);
                }
            }
            tag.subHashes = newOrder;
        };

        let rootTagName = parentTagName;
        let isRoot = !parentTagName.contains(".");
        if(!isRoot) {
            rootTagName = parentTagName.beforeString(".");
        }
        let rootTag = tagsSource.findOne({ owner: Meteor.userId(), name: rootTagName});
        if(!rootTag){
            throw new Meteor.Error("root tag not found");
        }

        if(!parentTagName.contains(".")) {
            //it's root - easy
            updateOrderForSubHashes(rootTag);
        }
        else {
            // not root, we must update the parent of the subhashes were the order changed
            let levels = parentTagName.split(".");
            let currentParentTagObj = rootTag;//.subHashes.find(t=>t.name == levels[0]+"."+levels[1]); //we know, that this isn't  root, so we get level two subHash of the root


            for(let i = 2; i<= levels.length; i++) {
                let currentLevelTagName = ""; //let's compose the first level tagname, e.g. #tag.level and find it in the currentParentSubhshes
                for(let j =0; j<i ; j++){
                    currentLevelTagName += levels[j];
                    if(j != i-1)
                        currentLevelTagName += ".";
                }

                if(!currentParentTagObj.subHashes){
                    throw new Meteor.Error("No subhashes on tag:"+currentParentTagObj.name);
                }
                let subTagObj = currentParentTagObj.subHashes.find(t => t.name == currentLevelTagName);
                if(!subTagObj)
                    throw new Meteor.Error("corrupted tag structure - couldn't find subtag '"+currentLevelTagName+"' in parent tag '"+currentParentTagObj.name+"'");

                currentParentTagObj = subTagObj;
            }

            updateOrderForSubHashes(currentParentTagObj);
        }

        tagsSource.update({ _id: rootTag._id}, {
            $set: {
                subHashes: rootTag.subHashes
            }
        })
    },
    exportData(){
        let tagsSource = Meteor.userId() ? Tags: TagsOffline;
        let notesSource = Meteor.userId() ? Notes: NotesOffline;
        let data = {
                            qnjFormatVersion: '0.8.0',
                            notes: notesSource.find({owner: Meteor.userId()}).fetch().map(n => {
                                return {
                                    createdAt: n.createdAt,
                                    tags: n.tags,
                                    text: n.text,
                                    updatedAt: n.updatedAt,
                                    updatedAtForSort: n.updatedAtForSort
                                }
                            }),
                            tags: tagsSource.find({owner: Meteor.userId()}).fetch().map(t => {
                                return {
                                    name: t.name,
                                    subHashes: t.subHashes
                                }
                            })
        };
        return data;
    },
    importData(importBodyBase64) {
        let notesSource = Meteor.userId() ? Notes: NotesOffline;

        var base64string = importBodyBase64.afterString(",");//after ',' because it begins with -> data:base64,
        var words = CryptoJS.enc.Base64.parse(base64string);
        var importBodyString = words.toString(CryptoJS.enc.Utf8);
        var importBody = JSON.parse(importBodyString);
        if(importBody.qnjFormatVersion != '0.8.0') {
            console.log("wrong");
            return "Wrong qnj file version";
        }
        let { notes, tags } = importBody;
        if(notes.length > MAX_NOTES_IMPORT){
            return "To many notes to import, split it into more files. (beta)";
        }
        notes.forEach(note => {
            note.owner = Meteor.userId();
            note.username =  Meteor.user().profile.name;
            notesSource.insert(note)
        });
        if(tags.length > MAX_TAGS){
            return "To many tags to import, notes are imported. (beta)";
        }
        tags.forEach(tag => {
            tag.owner = Meteor.userId();
            mergeTags(tag);
        });
        return "OK";
    },
    addOrUpdateNote(options) {
        // Is user is not logged in we use the offline notes collection
        let notesSource = Meteor.userId() ? Notes: NotesOffline;

        let retValue = "OK";
        let { text, noteId } = options;
        if(text.length > MAX_NOTE_LENGTH) {
            text = text.substring(0, MAX_NOTE_LENGTH);
            retValue = "MAX_NOTE_LENGTH";
        }

        // Extract hashtags in note text:
        let usedTags = text.match(/(^|\s)#([^\d&%$_\s-]\S{2,49})\b/g);
        let tags = [];
        if(usedTags) {
            usedTags.forEach(hash => {
                hash = hash.trim();
                if (hash.length > 1 && hash[1] != '#' && hash != "#All.Notes" && hash != "#No.Tags") { //we ignore the hardcoded #All.Notes and #No.Tags hash
                    if (hash.endsWith("."))
                        hash = hash.substring(0, hash.length - 1);
                    let subHashes = hash.substring(1).split(".");
                    let rootHashName = "#" + subHashes[0];
                    tags.push(rootHashName.toLowerCase().trim());

                    for (var i = 1; i < subHashes.length; i++) {
                        let subHashName = "#";
                        for (var j = 0; j <= i; j++) {
                            subHashName += subHashes[j];
                            if (j != i)
                                subHashName += ".";
                        }
                        tags.push(subHashName.toLowerCase().trim());
                    }
                }
            });
            tags = tags.reverse().filter(function (e, i, arr) {
                return tags.indexOf(e, i + 1) === -1;
            }).reverse();
        }

        if(!noteId) {
            let username = Meteor.user() ? Meteor.user().profile.name : "Demo";
            // Store note in db:
            notesSource.insert({
                text: text,
                isEmptyNewNote: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                updatedAtForSort: new Date(),
                owner: Meteor.userId(),
                username: username,
                tags: tags
            });
        }
        else{
            let setValues;
            if(options.isAutoSave){
                setValues = {
                    text: text,
                    isEmptyNewNote: false,
                    updatedAt: new Date(),
                    tags: tags
                };
            }
            else {
                setValues = {
                    text: text,
                    isEmptyNewNote: false,
                    updatedAt: new Date(),
                    updatedAtForSort: new Date(),
                    tags: tags
                };
            }
            notesSource.update({ _id: noteId}, {
                $set : setValues
            });
        }
        // Analyze hashtags to create hierarchy and store in db:
        let tagsHierarchy = [];
        tags.forEach(hash=>{
            let subHashes = hash.substring(1).split(".");
            let rootHashName = "#"+subHashes[0];

            let rootHash = tagsHierarchy.filter(t => t.name === rootHashName);
            if(rootHash.length == 0){
                rootHash = { name: rootHashName, subHashes: []};
                tagsHierarchy.push(rootHash);
            }
            else {
                rootHash = rootHash[0];
            }

            let currentTagInTagsHierarchy = rootHash;
            for(var i=1; i<subHashes.length;i++)
            {
                let subHashName = "#";
                for(var j=0;j<=i;j++)
                {
                    subHashName += subHashes[j];
                    if(j!=i)
                        subHashName += ".";
                }
                let subHash = currentTagInTagsHierarchy.subHashes.filter(sh => sh.name == subHashName);
                if(subHash.length == 0){
                    subHash = { name: subHashName, subHashes: [] };
                    currentTagInTagsHierarchy.subHashes.push(subHash);
                }
                else {
                    subHash = subHash[0];
                }
                currentTagInTagsHierarchy = subHash;
            }
        });
        //this is added to the account - used hashes
        if(tagsHierarchy) {
            for(let tagObj of tagsHierarchy)
            {
                tagObj.owner = this.userId;
                let result = mergeTags(tagObj);
                if(result == "MAX_TAGS") {
                    if(retValue == "OK") {
                        retValue = "MAX_TAGS";
                    };
                    break;
                }
            }
        }
        return retValue;
    },

    removeNote(noteId) {
        let notesSource = Meteor.userId() ? Notes: NotesOffline;
        const note = notesSource.findOne(noteId);
        if (Meteor.userId() && note.owner !== Meteor.userId()) {
            // If the note is private, make sure only the owner can delete it
            throw new Meteor.Error("not-authorized");
        }
        notesSource.remove(noteId);
    },
    removeTag(tagName){
        let tagsSource = Meteor.userId() ? Tags: TagsOffline;

        let rootTagName = tagName;
        let isRootTag = true;
        if(tagName.contains(".")){
            rootTagName = tagName.beforeString(".");
            isRootTag = false;
        }

        const rootTagObj = tagsSource.findOne({ $and: [ {owner: Meteor.userId()}, {name: rootTagName} ]});
        if(!rootTagObj){
            throw new Meteor.Error("tag not found, not-authorized");
        }

        // it root, just remove it
        if(isRootTag){
            tagsSource.remove(rootTagObj._id);
            return;
        }

        // not root, we must update the parent of the removed tag - by removing it from the subHashes collection
        let levels = tagName.split(".");
        let currentParentTagObj = rootTagObj; //we know, that this isn't  root, so if level one - the root will be parent

        for(let i = 2; i< levels.length; i++) {
            let currentLevelTagName = ""; //let's compose the first level tagname, e.g. #tag.level and find it in the currentParentSubhshes
            for(let j =0; j<i ; j++){
                currentLevelTagName += levels[j];
                if(j != i-1)
                    currentLevelTagName += ".";
            }
            let subTagObj = currentParentTagObj.subHashes.find(t => t.name == currentLevelTagName);
            if(!subTagObj)
                throw new Meteor.Error("corrupted tag structure");

            currentParentTagObj = subTagObj;
        }

        currentParentTagObj.subHashes = currentParentTagObj.subHashes.filter(sh => sh.name != tagName);
        tagsSource.update({ _id : rootTagObj._id}, rootTagObj);
    }
});