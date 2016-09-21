import NotesWorkspace from './NotesWorkspace';
import TagList from './TagList';
import ModalManager from './ModalManager'
import LoginPage from './LoginPage';
import LoginOnDemo from './LoginOnDemo';
import MainMenu from './MainMenu';
import Settings from '../../lib/Settings';
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

export default React.createClass({
    // This mixin makes the getMeteorData method work
    mixins: [ReactMeteorData],
    getInitialState() {
        return {
            currentTagName: "#All.Notes", // by default get all notes
            currentTag: null,
            currentRootTag: null,
            updatehack: 1,
            isDemoMode: false
        }
    },
    updateDimensions: function() {
        let width = $(window).width();
        this.setState({
            isMobile: width < 1200,
            isMobileSmall: width < 640
        });
    },
    componentWillMount: function() {
        this.updateDimensions();
    },
    componentDidMount: function() {
        window.addEventListener("resize", this.updateDimensions);
    },
    componentWillUnmount: function() {
        window.removeEventListener("resize", this.updateDimensions);
    },
    // Loads items from the Notes collection and puts them on this.data.tasks
    getMeteorData() {
        let tagsSource = Meteor.userId() ? Tags: TagsOffline;
        let notesSource = Meteor.userId() ? Notes: NotesOffline;
        let userDataSource =  Meteor.userId() ? UserData : UserDataOffline;
        let query = {};

        if(this.state.currentTagName != "#All.Notes"){
            if(this.state.currentTagName != "#No.Tags") {
                query = {
                    tags: this.state.currentTagName
                }
            }
            else{
                query = {
                    tags: { $size: 0}
                }
            }
        }


        let tagsFromDb =  tagsSource.find({}).fetch();
        let tags = tagsFromDb;
        // order the tags
        let userData = userDataSource.find({}).fetch()[0];
        if(userData) {
            let { tagsOrder } = userData;
            if(tagsOrder) {
                tags = [];
                for (let i = 0; i < tagsOrder.length; i++) {
                    let tag = tagsFromDb.find(t => t.name == tagsOrder[i]);
                    if (tag) {
                        tags.push(tag);
                    }
                }
                for (let tagFromDb of tagsFromDb) {
                    let existing = tags.find(t => t.name == tagFromDb.name);
                    if (!existing) {
                        tags.push(tagFromDb);
                    }
                }
            }
        }
        else{
            userData = {};
        }
        tags.push({
            name: "#No.Tags",
            subHashes: [],
            isHardcoded: true
        });
        tags.unshift({
            name: "#All.Notes",
            subHashes: [],
            isHardcoded: true
        });

        return {
            notes: notesSource.find(query, {sort: {updatedAtForSort: -1}, limit: Session.get("itemsLimit")}).fetch(),
            userdata: userData,
            tags: tags,
            subHashExists: tags.some(t=> t.subHashes && t.subHashes.length > 0),
            currentUser: Meteor.user()
        };
    },
    handleSubmit(event) {
        event.preventDefault();
        let text = "";
        if(this.state.currentTagName && this.state.currentTag && !this.state.currentTag.isHardcoded)
            text = "\r\n" + this.state.currentTagName + "\r\n";
        let addedEvent = new CustomEvent("adding-note");
        window.dispatchEvent(addedEvent);
        Meteor.call("addOrUpdateNote", {
            text: text
        });
    },
    onTagSelect: function (tagDOMelement) {
        Session.set("itemsLimit", Settings.ItemsLimit);
        let tag = tagDOMelement.props.tag;
        if(tag.subHashes)
            tag.subHashes.forEach((subTag) => {
                subTag.parent = tag
            });
        //get currently selected root
        let rootTag = tag;
        if(tag.name.contains(".")) {//not root, get the root
            let rootTagName = tag.name.beforeString(".");
            rootTag = this.data.tags.find(r => r.name == rootTagName);
        }
        this.setState({
            currentRootTag: rootTag,
            currentTagName: tag.name,
            currentTag: tag,
            updatehack: Math.random()
        }, () =>{
            // hack so that masonry refreshes, the timeout needs to be bigger than the transition duration set in notesWorkspace
            setTimeout(() => {
                this.setState({
                    updatehack: Math.random()
                })
            }, 200);
        });
    },
    tagListRootRefresh(){
      this.refs.rootTagsRef.rearrange();
    },
    tagListRefresh(tagName) {
        let subTagsRef = this.refs["subTagsRef"+tagName];
        if(subTagsRef) {
            this.refs["subTagsRef" + tagName].rearrange();
        }
    },
    enableDemoMode() {
        this.setState({isDemoMode: true});
        ga('send', 'pageview', '/demo/');
    },
    loginGoogle(){
        ga('send', 'event', 'Login', 'Google');
        this.setState(this.getInitialState(), () => {
            Meteor.loginWithGoogle();
        });
    },
    loginFacebook() {
        ga('send', 'event', 'Login', 'Facebook');
        this.setState(this.getInitialState(), () => {
            Meteor.loginWithFacebook();
        });
    },
    logout() {
      if(!this.data.currentUser) {
          this.setState(this.getInitialState());
      }
      else{
          Meteor.logout();
      }
    },
    modalManager: null,
    render() {
        if(!Meteor.userId() && !this.state.isDemoMode)
            return <LoginPage
                loginFacebook={this.loginFacebook}
                loginGoogle={this.loginGoogle}
                enableDemoMode={this.enableDemoMode} />;

        let subTagList = [];
        this.data.tags.forEach(rootTag => {
            rootTag.subHashes.forEach(subHash => {
               subHash.parent = rootTag;
            });
            subTagList.push(<TagList key={rootTag.name}
                                     ref={"subTagsRef"+rootTag.name}
                                     selectedTagName={this.state.currentTagName}
                                     isRoot={false}
                                     isMobile={this.state.isMobile}
                                     isVisible={this.state.currentRootTag && this.state.currentRootTag.name == rootTag.name}
                                     tags={rootTag.subHashes}
                                     onTagSelect={this.onTagSelect}/>)
        } );

        const mainMenuClicked = () => {
                if(!this.data.userdata.menuOpened){
                    Meteor.call("menuOpened");
                }
        };

        return (
            <div className="container">
                <header>
                    { this.state.isMobile ? (
                            <h1>Q<div className="beta-title">&#946;</div></h1>
                        ):(
                            <h1 onClick={() => this.modalManager.openAboutModal()} style={{cursor: "pointer"}}>Quickno<span className="t-dot-e">t<span className="dot">.</span>e</span>s<div className="beta-title">BETA</div></h1>
                    )}
                    { this.state.isMobile ? (
                        <div className="add-button add-button-mobile" onClick={this.handleSubmit}>
                            <div className="plus-icon-mobile">+</div>
                        </div>
                        ):(
                        <div className="add-button" onClick={this.handleSubmit}>
                            <div className="plus-icon-wrapper">
                                <div className="plus-icon">+</div>
                            </div>
                            <i className="fa fa-sticky-note-o plus-note"/>
                            <div className="plus-equal">☰</div>
                        </div>
                    )}

                    <MainMenu getModalManager={() => this.modalManager}
                              isMobile={this.state.isMobile}
                              logout={this.logout}
                              username={this.state.isDemoMode ? "Demo Mode" : Meteor.user().profile.name}
                              Clicked={mainMenuClicked} />
                    { !this.data.userdata.menuOpened && !this.state.isMobile && <span className="first-tips-top-right" style={{float: "right"}}>Menu&nbsp;<i className="fa fa-arrow-right"></i></span>}

                    { this.data.tags.length > 2 &&
                            <TagList tags={this.data.tags}
                                    ref="rootTagsRef"
                                    isRoot={true}
                                    isMobile={this.state.isMobile}
                                    isVisible={true}
                                    selectedTagName={this.state.currentTagName}
                                    onTagSelect={this.onTagSelect}/>
                    }
                    { this.data.tags.length <= 2 && this.data.notes.length > 0 && !this.state.isMobile &&
                            <span className="first-tips-top-left">Write a <span className="cm-hashtag-inline">#hashtag</span> in a note to keep the notes organized</span>
                    }
                    { this.data.tags.length <= 2 && this.data.notes.length > 0 && this.state.isMobile &&
                        <span className="first-tips-top-left">Write a <span className="cm-hashtag-inline">#hashtag</span></span>
                    }
                    { this.data.tags.length <= 2 && this.data.notes.length == 0 &&
                            <span className="first-tips-top-left"><i className="fa fa-arrow-left"></i>&nbsp;Click to create a new note</span>
                    }

                    <div className="clear"></div>
                </header>
                <ModalManager ref={(mm) => this.modalManager = mm } tags={this.data.tags}  tagListRefresh={this.tagListRefresh} updateRootTags={this.tagListRootRefresh} />
                <NotesWorkspace notes={this.data.notes}
                                tags={this.data.tags}
                                isMobile={this.state.isMobile}
                                isMobileSmall={this.state.isMobileSmall}
                                isDemoMode={this.state.isDemoMode}
                                updatehack={this.state.updatehack} tagListRefresh={this.tagListRefresh}/>
                <div className="main-sub-tag-list">
                    {subTagList}
                </div>
                { this.data.notes.length > 0 && !this.data.subHashExists && !this.state.isMobile &&
                    <span className="first-tips-bottom">Use a dot to create a <span className="cm-hashtag-inline">#hierarchic<b style={{color: 'red'}}>.</b>hashtag</span> organizing your notes even better</span>
                }
                {
                    this.state.isDemoMode ? (
                        <div className="login-on-demo login-panel login-panel-demo">
                            <LoginOnDemo
                                loginFacebook={this.loginFacebook}
                                loginGoogle={this.loginGoogle}
                                isMobile={this.state.isMobileSmall}
                            ></LoginOnDemo>
                        </div>
                    ):(
                        <div className="a7plus-logo">
                            <a href="http://a7pl.us/" target="_blank"> <img height="32" src="\a7plus_logo.png"></img></a>
                        </div>
                    )
                }
            </div>
        );
    }
});