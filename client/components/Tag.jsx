import TagList from './TagList';
var ReactCSSTransitionGroup = React.addons.CSSTransitionGroup;

// Tag component - represents a single tag
export default React.createClass({
    propTypes: {
        // This component gets the note to display through a React prop.
        // We can use propTypes to indicate it is required
        tag: React.PropTypes.object.isRequired
    },
    getInitialState: function(){
        return { selected: this.props.selected }
    },
    tagSelectedEventHandler(e) {
        var isSelected = false;
        if(e.detail.tagName == this.props.tag.name) {
            isSelected = true;
        }
        else {
            //was so that the root is selected when child is selected...
            //check if this is root and some subtag selected:
            //if (this.props.tag.name.indexOf(".") == -1) {
            //    var dotPos = e.detail.tagName.indexOf(".");
            //    var selectedRoot = e.detail.tagName.substr(0, dotPos);
            //    if (this.props.tag.name == selectedRoot) {
            //        isSelected = true;
            //    }
            //}
        }
        this.setState({
            selected: isSelected
        });
    },
    componentDidMount() {
        window.addEventListener('tag-selected', this.tagSelectedEventHandler);
    },
    componentWillUnmount() {
        window.removeEventListener("tag-selected", this.tagSelectedEventHandler)
    },
    onTagSelect: function (ev) {
        this.setState({selected:true});
        if (this.props.onTagSelect) {
            this.props.onTagSelect(this);
        }
        let eventForNavigation = new CustomEvent('tag-selected', { detail: { tagName: this.props.tag.name } });
        window.dispatchEvent(eventForNavigation);
        ev.preventDefault();
        ev.stopPropagation();
    },
    rearrangeSubTags() {
        let list = this.refs[this.props.tag.name+"list"];
        if(list){
           list.rearrange();
        }
    },
    render() {
        let tagHierarchiesCount = 0;
        let tagClass = "tag-main";

        if(this.props.tag.isHardcoded){
            tagClass += " tag-hardcoded";
        }
        else
        {
            let tagName = this.props.tag.name;
            tagHierarchiesCount = tagName.split('.').length;
            switch (tagHierarchiesCount)
            {
                case 0:
                case 1:
                case 2:
                    tagClass += " tag-level-1"; break;
                case 3:
                    tagClass += " tag-level-2"; break;
                case 4:
                    tagClass += " tag-level-3"; break;
                case 5:
                    tagClass += " tag-level-4"; break;
                default:
                    tagClass += " tag-level-5";
            }
        }



        if(this.props.isRoot) {
            tagClass += " tag-root";
        }
        if(this.props.isMobile){
            tagClass += " tag-main-mobile";
        }

        if(this.state.selected && !this.props.isHidden) { // hidden (from dropdown) has a seperate selected class
            if(this.props.isRoot)
                tagClass += " tag-selected-root";
            else
                tagClass += " tag-selected";
        }

        if(this.props.isVisible)
            tagClass += " horizontal-transition-visible";
        else
            tagClass += " horizontal-transition-hidden";

        if(this.props.isHidden){
            tagClass += " tag-hidden";
            if(this.state.selected) {
                tagClass += " tag-hidden-selected";
            }
        }

        let parentName = '';
        let thisLevelName = '';
        let tag = this.props.tag;
        if(tag.isHardcoded || !tag.name.contains(".")){ //root or hardcoded - we display the whole tag name in big letters
            thisLevelName = tag.name;
            if(tag.isHardcoded && this.props.isMobile && tag.name == "#All.Notes"){
                thisLevelName = "#All";
            }
        }
        else{
            thisLevelName = tag.name.afterString(".", true); //some child, get the name of the child level
            if(tagHierarchiesCount == 2) {
                parentName = tag.name.beforeString(".", true);
            }
            parentName += ".";
        }

        let subHashes = <span></span>;
        let selectedThisOrChild = false;
        if(this.props.selectedTagName)
            selectedThisOrChild = this.props.selectedTagName.startsWith(tag.name);

        var displayStyle = "inline-block";
        if(this.props.isHidden){
            displayStyle = "block";
        }

        return (
            <div style={{display: displayStyle}}>
                <div key={this.props.tag.name} className={tagClass} onClick={this.onTagSelect}
                   data-id={this.props.tag.name}>
                    <span className="tag-name-smaller">{parentName}</span>{thisLevelName}
                </div>
                {
                    this.props.isRoot?"":
                <TagList
                    key={tag.name+"list"}
                    ref={tag.name+"list"}
                    style={{display: "inline-block", maxWidth: 0}}
                    tags={tag.subHashes}
                    isRoot={false}
                    isVisible={selectedThisOrChild}
                    selectedTagName={this.props.selectedTagName}
                    openSettings={this.props.openSettings}
                    onTagSelect={this.props.onTagSelect}
                />
                }
            </div>
        );
    }
});
