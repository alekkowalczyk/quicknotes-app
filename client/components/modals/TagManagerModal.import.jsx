import TagItem from './TagManagerItem';

const {  DropTarget, DragDropContext } = ReactDnD;
const update = React_Addons_Update;

const tagTarget = {
    drop() {
    }
};

@DragDropContext(ReactDnD_HTML5Backend)
@DropTarget("tag", tagTarget, connect => ({
    connectDropTarget: connect.dropTarget()
}))


export default class TagManagerModal extends React.Component {

    constructor(props)
    {
        super(props);
        this.state = {
            currentTag : null,
            mode: 'view'
        };
        this.setCurrentTag = this.setCurrentTag.bind(this);
        this.orderChanged = this.orderChanged.bind(this);
        this.deleteTag = this.deleteTag.bind(this);
        this.closing = this.closing.bind(this);
        this.moveTag = this.moveTag.bind(this);
        this.findTag = this.findTag.bind(this);
        this.refreshTags = this.refreshTags.bind(this);
    }

    componentDidMount() {
        this.mounted = true;
        this.props.modalManager.tagManager = this;
    }

    componentDidUpdate() {
        if(!this.mounted)
            return;
        if(!this.state.tags
                || (
                !this.state.currentTag &&
                    this.state.tags.length != this.getRootTags().length
            )){
            this.refreshTags();
        }
    }

    refreshTags() {
        this.setState({
            tags: this.getRootTags()
        });
    }

    getRootTags() {
        return this.props.tags.filter(t => !t.isHardcoded);
    }

    moveTag(id, atIndex) {
        const { tag, index } = this.findTag(id);
        this.setState(update(this.state, {
            tags: {
                $splice: [
                    [index, 1],
                    [atIndex, 0, tag]
                ]
            }
        }));
    }

    orderChanged(id, orginalIndex){
        ////root tag change order:
        if(!this.state.currentTag) {
            var tagOrder = this.state.tags.map(t=>t.name);
            Meteor.call("changeRootTagOrder", tagOrder, (error, result) => {
                    this.props.updateRootTags();
                }
            );
        }
        else{
            //we change order of subhashes
            Meteor.call("changeSubTagOrder", this.state.currentTag.name, this.state.tags.map(t=>t.name), (error, result) =>{
               this.props.updateRootTags();
                let rootTagName = this.state.currentTag.name;
                if(rootTagName.contains(".")){
                    rootTagName = rootTagName.beforeString(".");
                }
               this.props.tagListRefresh(rootTagName);
            });
        }
    }

    findTag(name) {
        const { tags } = this.state;
        const tag = tags.filter(c => c.name === name)[0];

        return {
            tag,
            index: tags.indexOf(tag)
        };
    }

    closing() : void {
        this.setState({
            currentTag : null,
            tags: this.getRootTags(),
            mode: 'view'
        });
        this.props.closeModal();
    }

    setCurrentTag(tag, withParentSet) {
        if(!tag) {
            this.setState({
                currentTag: null,
                tags: this.getRootTags()
            });
            return;
        }

        if(withParentSet && this.state.currentTag){
            tag.parent = this.state.currentTag;
        }

        this.setState({
            currentTag: tag,
            tags: tag.subHashes
        });
    }

    deleteTag(tag){
        alertify.confirm("Are you sure to delete tag "+tag.name+"?", () => {
            Meteor.call("removeTag", tag.name, () =>{
                if(this.state.currentTag) { //if current tag we are not in the root and need a hack to refresh the list
                    let currentTag = this.state.currentTag;
                    currentTag.subHashes = currentTag.subHashes.filter(t => t.name != tag.name);
                    this.setState({
                        currentTag: currentTag,
                        tags: currentTag.subHashes
                    });
                }
            });
        });
    }

    render(){
        let tagSettingsModalHeader = "Tag settings";
        let { connectDropTarget } = this.props;
        let { tags } = this.state;

        if(!tags){
            return <div/>
        }

        let subTagsExist = false;
        for(let tag of tags)
        {
            if(tag.subHashes && tag.subHashes.length > 0) {
                subTagsExist = true;
                break;
            }
        }

        return (<div><Modal
            id="tagOrderModal"
            ionClose={true}
            isOpen={this.props.isOpen}
            close={this.closing}
            title={tagSettingsModalHeader}
        >
            <div>
                <div className={"modal-tab-header"+(this.state.mode == 'view'?" modal-tab-header-active":"")} onClick={() => this.setState({ mode: 'view'})}>View</div>
                <div className={"modal-tab-header"+(this.state.mode == 'reorder'?" modal-tab-header-active":"")} onClick={() => this.setState({ mode: 'reorder'})}>Reorder</div>
                <div className={"modal-tab-header"+(this.state.mode == 'delete'?" modal-tab-header-active":"")} onClick={() => this.setState({ mode: 'delete'})}>Remove</div>
            </div>
            <div className="modal-tabs-box">
                <div>
                    { this.state.currentTag && (
                        <div>
                            <div className="tag-manager-current-tag-label">Child tags of:</div>
                            <div className="tag-manager-item-button" onClick={() => this.setCurrentTag(this.state.currentTag.parent, false)}><i className="fa fa-angle-double-up"></i></div>
                            <div className="tag-manager-tag">{this.state.currentTag.name}</div>
                        </div>
                        )}
                    { !this.state.currentTag && (
                        <div className="tag-manager-current-tag-label">Main level tags:</div>
                        )}
                    { subTagsExist && <div><small className="side-note">Please click <i style={{ height: '1em', verticalAlign: 'middle'}} className="fa fa-angle-double-down tag-manager-item-button"></i> on a tag, to view and edit the sub tags of that tag.</small></div> }
                </div>
                {
                    connectDropTarget(
                        <div>
                            {tags.map((tag) => {
                                return (
                                <TagItem
                                    key={tag.name}
                                    id={tag.name}
                                    tag={tag}
                                    mode={this.state.mode}
                                    setCurrentTag={this.setCurrentTag}
                                    deleteTag={this.deleteTag}
                                    moveTag={this.moveTag}
                                    findTag={this.findTag}
                                    orderChanged={this.orderChanged}
                                />
                                    );
                                })}
                        </div>
                        )
                }
            </div>
        </Modal></div>);
    }
}

TagManagerModal.propTypes = {
    tags: React.PropTypes.array.isRequired,
    isOpen: React.PropTypes.bool.isRequired,
    closeModal: React.PropTypes.func.isRequired
};