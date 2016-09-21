// Note component - represents a single note
//import ReactMarkdownMediumEditor from '{universe:react-markdown-wysiwyg}/ReactMarkdownMediumEditor';
//import mediumEditor from '{universe:react-markdown-wysiwyg}/editor/medium-editor';
var MAX_NOTE_LENGTH = 7000; //Is defined also in client/components/Note.import.jsx
export default React.createClass({
    propTypes: {
        // This component gets the note to display through a React prop.
        // We can use propTypes to indicate it is required
        note: React.PropTypes.object.isRequired
    },
    getInitialState(){
        return {
            isReadOnly : !this.props.note.isEmptyNewNote,
            statusText: "",
            saveInSeconds : -1
        };
    },
    isTimerRunning : false, //used for autosave
    lastTextChangeTime : undefined, // used for autosave
    orginialText: undefined, // we set it on simpleMde init
    noteHeight: 0, // we store the height to keep a look on it when text changes, so that we can update the layout when the height changes.
    componentDidMount() {
        this.highlight();
    },
    componentDidUpdate(){
        this.highlight();
    },
    highlight() {
        if(this.state.isReadOnly) {
            $(".note-content").html(function () {
                return $(this).html().replace(/#\S+/g, '<span class="cm-hashtag-inline">$&</span>');
            });
        }
    },
    handleClick: function (e) {
        var component = ReactDOM.findDOMNode(this.refs.component);
        if (e.target == component || $(component).has(e.target).length) {
            // Inside of the component.
            this.setEditMode();
        } else {
            // Outside of the component.
            if(!this.state.isReadOnly && this.simpleMde)
            {
                this.saveNote(true, true);
            }
        }
    },
    handleAnyNoteSetsEditMode: function(e) {
        if(e.detail != this) {
            // Some other note entered edit mode - we support only one!
            this.saveNote();
        }
    },
    handleAddingNote: function(e) {
      this.saveNote(false, true);
    },
    componentWillMount() {
        document.addEventListener('dblclick', this.handleClick, false);
        document.addEventListener('note-sets-edit-mode', this.handleAnyNoteSetsEditMode, false);
        window.addEventListener('tag-selected', this.saveNote, false);
        window.addEventListener("adding-note", this.handleAddingNote, false);
    },
    componentWillUnmount() {
        document.removeEventListener('dblclick', this.handleClick, false);
        document.removeEventListener('note-sets-edit-mode', this.handleAnyNoteSetsEditMode, false);
        window.removeEventListener('tag-selected', this.saveNote, false);
        window.removeEventListener("adding-note", this.handleAddingNote, false);
    },
    saveNote(isAutoSave, forceClose) { // if isAutoSave is true and forceClose not true, we don't go to read only after save, and keep the original text
        if(this.simpleMde && !this.state.isReadOnly) {
            //if autosave is true as well force close, it means that the "save without go up" button was clicked.
            //if autosave is not true, it means that the "save with go up" button was clicked.
            let saveClicked = !isAutoSave || (isAutoSave && forceClose);
            let updatedText = this.simpleMde.value();
            if (updatedText != this.props.note.text || !isAutoSave) { // if it's not autosave, we save the message to at least update the updatedAtForSort field
                this.setState({ statusText: "Saving...", saveInSeconds: -1});
                Meteor.call("addOrUpdateNote", {
                    text: updatedText,
                    noteId: this.props.note._id,
                    isAutoSave: isAutoSave
                }, (error, result) => {
                    if(result == "OK") {
                        this.setState({statusText: "Saved"});
                    }
                    if(result== "MAX_TAGS") {
                        if (saveClicked) {
                            alertify.alert("You have exceeded the maximal number of managed #tags, please go to 'Tag Settings' in the top right menu and remove some not used tags. <b>Note has been saved</b>, but newly added tags are not anymore displayed on the tag selector.");
                        }
                        this.setState({statusText: "Note saved, but too many tags. Please clean your tag list in tag settings."});
                    }
                    if(result== "MAX_NOTE_LENGTH") {
                        if (saveClicked) {
                            alertify.alert("You have exceeded the maximal note length. Only a part of the note has been saved. Consider splitting your note in more notes.");
                        }
                        this.setState({statusText: "Note to long, only part saved. Consider splitting your note in more notes."});
                    }
                    // Refresh all 1st level subtags for this note by passing all root tags to the tagListRefresh function:
                    this.props.note.tags.forEach((tag) => {
                        if(!tag.contains('.')){
                            this.props.tagListRefresh(tag);
                        }
                    });
                    if(!isAutoSave || forceClose) {
                        this.setReadOnly();
                        this.orginialText = updatedText;
                    }
                });
            } else {
                if(!isAutoSave || forceClose) {
                    this.setReadOnly();
                    this.orginialText = updatedText;
                }
            }
        }
    },
    setReadOnly(){
        this.setState({
            isReadOnly: true,
            statusText : "",
            saveInSeconds: -1
        });
        this.isTimerRunning = false;
        if(this.simpleMde)
        {
            this.simpleMde.value(this.props.note.text);
        }
        this.props.updateMasonryHackCallback();
    },
    exitEditMode() {
        let updatedText = this.simpleMde.value();
        if (updatedText != this.orginialText) { //the text is different than the original one, we assume that autosave already saved the changed values
            this.setState({ statusText: "Undoing changes..."});
            Meteor.call("addOrUpdateNote", {
                text: this.orginialText,
                noteId: this.props.note._id,
                isAutoSave: true // it's not autosave, but for autosave the updatedAt property isn't updated, and we don't want this property to be updated on exitEditMode
            }, (error, result) => {
                this.setReadOnly();
            });
        } else {
            this.setReadOnly();
        }
    },
    setEditMode(){
        this.setState({isReadOnly: false, statusText: ""});
        this.props.updateMasonryHackCallback();
        //fire an event, so that other note when it edit mode - changes to read only mode
        var evt = new CustomEvent("note-sets-edit-mode", { detail: this });
        document.dispatchEvent(evt);
    },
    deleteThisNote() {
        alertify.confirm("Are you sure that you want to delete this note?",
            () => Meteor.call("removeNote", this.props.note._id)
        );
    },
    textChanged() {
        this.lastTextChangeTime = new Date();
        const actualHeight = $(ReactDOM.findDOMNode(this)).height();
        if(this.noteHeight == 0){
            this.noteHeight = actualHeight;
        }
        if(this.noteHeight != actualHeight){
            //console.log("hack:"+this.noteHeight+":"+actualHeight);
            this.props.updateMasonryHackCallback();
            this.noteHeight = actualHeight;
        }
        this.setState({
            saveInSeconds: 5
        });
        let timeOut = () =>{

            if(this.isTimerRunning) {
                var now = new Date();
                var dif = now.getTime() - this.lastTextChangeTime.getTime();
                var seconds = Math.round(Math.abs(dif/1000));
                if(seconds >=  5){
                    this.saveNote(true); //leave in edit mode
                    this.isTimerRunning = false;
                    this.setState({
                        saveInSeconds: -1
                    });
                } else{
                    this.setState({
                        saveInSeconds: 5 - seconds
                    });
                    window.setTimeout(timeOut, 300);
                }
            }
        };
        if(!this.isTimerRunning){
            this.setState({ statusText: ""});
            this.isTimerRunning = true;
            window.setTimeout(timeOut, 300);
        }
        if(this.simpleMde)
        {
            let text = this.simpleMde.value();
            if(text.length > MAX_NOTE_LENGTH) {
                alertify.alert("Maximal length of note exceeded, please split your content into several notes.");
                this.simpleMde.value(text.substring(0, MAX_NOTE_LENGTH));
            }
        }
    },
    hashtagHint(editor, options) {
        let tags = this.props.allTags.filter(t => !t.isHardcoded);
        // Find the token at the cursor
        const cur = editor.getCursor();
        const token = editor.getTokenAt(cur);
        let list = [];
        let str = "";
        const streamSeen = token.state.streamSeen.string;
        let strPos = streamSeen.lastIndexOf("#");
        if(strPos != -1){
            str = streamSeen.substr(strPos);
        }
        if(str == ''){
            return;
        }
        if(strPos>0) { //check if not hash inside a word
            let charBefore = streamSeen.substr(strPos-1,1);
            if(!/\s/.test(charBefore))
                return;
        }

        let filterTags = (tagsList, pattern) => {
            let list = tagsList.filter(tag => tag.name.startsWith(pattern));
            //if less than 3 elements - include the subhashes of those elements
            if(list.length<3){
                let newList = [];
                list.forEach((tag) =>{
                    newList.push(tag);
                    if(tag && tag.subHashes)
                    {
                        tag.subHashes.forEach((sh)=> {
                            newList.push(sh);
                        })
                    }
                });
                list = newList;
            }
            return list.map(t => t.name);
        }

        if(token.string == "#"){
            list = tags.map((t) => t.name);
        } else if (!str.contains(".")) {
            list = filterTags(tags, str);
        } else {
            // the str is a subhash because contains a dot, lets analyze this hierarchic hashtag
            let currentBeforeDot = str.beforeString(".", false);
            let currentAfterDot = str.afterString(".");
            let currentParentTag = tags.find(t => t.name == currentBeforeDot);
            if(currentParentTag) {
                while (currentAfterDot.contains(".")) {
                    let tmpCurrentBeforeDot = currentBeforeDot + "." + currentAfterDot.beforeString(".");
                    let tmpCurrentAfterDot = currentAfterDot.afterString(".");
                    let tmpCurrentParentTag = currentParentTag.subHashes.find(t => t.name == tmpCurrentBeforeDot);
                    if(tmpCurrentParentTag){
                        currentParentTag = tmpCurrentParentTag;
                        currentAfterDot = tmpCurrentAfterDot;
                        currentBeforeDot = tmpCurrentBeforeDot;
                    } else {
                        break;
                    }
                }
                list = filterTags(currentParentTag.subHashes, currentBeforeDot +"."+ currentAfterDot);
            }
        }


        return {list: list,
            from: CodeMirror.Pos(cur.line, strPos),
            to: CodeMirror.Pos(cur.line, token.end)};
    },
    autocomplete(cm, pred) {
        if (!pred || pred()) setTimeout(() => {
            if (!cm.state.completionActive)
            {
                CodeMirror.showHint(cm, this.hashtagHint, {completeSingle: false});
            }
        }, 100);
        return CodeMirror.Pass;
    },
    render() {
        //if not tags in note
        if(!this.props.note.tags)
            this.props.note.tags = [];
        let textAreaCallback = (c) => {
            if(c && !c.isMdeSet)
            {
                this.simpleMde = new SimpleMDE({
                    element: c,
                    status: false,
                    spellChecker: false,
                    autofocus: true,
                    toolbar: false,
                    previewRender: (text) => {
                        return text;
                    }
                });
                this.orginialText = this.props.note.text;
                this.simpleMde.codemirror.on("change", this.textChanged);
                this.simpleMde.codemirror.setOption("mode", "quicknotes");
                this.simpleMde.codemirror.setOption("extraKeys",{"'#'": this.autocomplete,  "'.'": this.autocomplete});
                c.isMdeSet = true;
                c.simpleMde = this.simpleMde;
            }
        };

        let markdownOptions = {
            linkify: true,
            typographer: true,
            breaks: true
        };

        let noteMenuClass = "note-menu";
        let noteEditMenuClass = "note-edit-menu";
        let noteClass = "note";

        if(this.state.isReadOnly){
            noteMenuClass += " horizontal-transition-visible";
            noteEditMenuClass += " vertical-transition-hidden";
            noteClass += " note-read-only";
        }else{
            noteMenuClass += " horizontal-transition-hidden";
            noteEditMenuClass += " vertical-transition-visible";
            noteClass += " note-edit";
        }

        let text = this.props.note.text;

        return (
            <div className={noteClass} ref="component" >
                <div className={noteMenuClass}>
                    <div className="note-menu-item delete" onClick={this.deleteThisNote}>
                        <i className="fa fa-close"/>
                    </div>
                    <div className="note-menu-item" onClick={this.setEditMode}>
                        <i className="fa fa-pencil" />
                    </div>
                </div>
                <div className={noteEditMenuClass}>
                    <div className="note-edit-menu-item-group">
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleBold();
                        }}>
                            <i className="fa fa-bold"/>
                        </div>
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleItalic();
                        }}>
                            <i className="fa fa-italic"/>
                        </div>
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleHeadingSmaller();
                        }}>
                            <i className="fa fa-header"/>
                        </div>
                    </div>
                    <div className="note-edit-menu-item-group">
                        { !this.props.isMobileSmall &&
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleCodeBlock();
                        }}>
                            <i className="fa fa-code"/>
                        </div>
                        }
                        { !this.props.isMobileSmall &&
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleBlockquote();
                        }}>
                            <i className="fa fa-quote-left"/>
                        </div>
                            }
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleUnorderedList();
                        }}>
                            <i className="fa fa-list-ul"/>
                        </div>
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.toggleOrderedList();
                        }}>
                            <i className="fa fa-list-ol"/>
                        </div>
                    </div>
                    { !this.props.isMobileSmall &&
                    <div className="note-edit-menu-item-group">
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.drawLink();
                        }}>
                            <i className="fa fa-link"/>
                        </div>
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.drawImage();
                        }}>
                            <i className="fa fa-picture-o"/>
                        </div>
                        <div className="note-edit-menu-item" onClick={() => {
                            if(this.simpleMde)
                                this.simpleMde.drawTable();
                        }}>
                            <i className="fa fa-table"/>
                        </div>
                    </div> }
                    { !this.props.isMobileSmall &&
                    <div className="note-edit-menu-item-group">
                        <div className="note-edit-menu-item" onClick={() => {
                            window.open("http://nextstepwebs.github.io/simplemde-markdown-editor/markdown-guide", "_blank");
                        }}>
                            <i className="fa fa-question-circle"/>
                        </div>
                    </div>
                    }
                    <div className="note-edit-menu-item-group note-edit-menu-item-group-right">
                        <div
                            data-tip data-for='undoTip'
                            className="note-edit-menu-item note-edit-menu-item-delete" onClick={this.exitEditMode}>
                            <i className="fa fa-close"/>
                        </div>
                        <ReactTooltip id='undoTip' place="left" type="error" >
                            <span>Undo changes</span>
                        </ReactTooltip>
                        <div
                            data-tip data-for='saveTip'
                            className="note-edit-menu-item note-edit-menu-item-save" onClick={() => this.saveNote(true, true)}>
                            <i className="fa fa-check"/>
                        </div>
                        <ReactTooltip id='saveTip' place="bottom" type="success">
                            <span>Save note</span>
                        </ReactTooltip>
                        <div
                            data-tip data-for='saveTopTip'
                            className="note-edit-menu-item note-edit-menu-item-save-up" onClick={() => this.saveNote()}>
                            <i className="fa fa-check"/>
                            <i className="fa fa-sort-up note-edit-menu-item-up"  />
                        </div>
                        <ReactTooltip id='saveTopTip' place="right" type="success">
                            <span>Save & move to top</span>
                        </ReactTooltip>
                    </div>
                </div>
                { this.state.isReadOnly ?
                    (<span className="note-content"><Markdown options={markdownOptions}>{text}</Markdown></span>)
                    :
                    <div>
                        <div className="note-edit-content">
                            <textarea ref={textAreaCallback} defaultValue={this.props.note.text}  />
                        </div>
                        { this.state.saveInSeconds >= 0 ? <div className="note-status">Autosave in {this.state.saveInSeconds} seconds...</div>
                            :
                            ""}
                        { this.state.statusText && this.state.saveInSeconds < 0 && <div className="note-status">{this.state.statusText}</div> }
                    </div>
                }
            </div>
        );

//TODO: Preview, side-by-side, full-screen buttons:
//        <div className="note-edit-menu-item" onClick={() => {
//                            if(this.simpleMde)
//                                this.simpleMde.togglePreview();
//                        }}>
//            <i className="fa fa-eye no-disable"/>
//        </div>
//        <div className="note-edit-menu-item" onClick={() => {
//            if(this.simpleMde)
//                this.simpleMde.toggleSideBySide();
//           }}>
//              <i className="fa fa-columns no-disable no-mobile"/>
//        </div>
//            <div className="note-edit-menu-item" onClick={() => {
//            if(this.simpleMde)
//                this.simpleMde.toggleFullScreen();
//        }}>
//             <i className="fa fa-arrows-alt no-disable no-mobile"/>
//      </div>
    }
});