import Tag from './Tag';
import DropdownMenu from './DropdownMenu';

export default React.createClass({
    getInitialState() {
        return {
            vTags: [],
            hTags: [],
            lastSetTagsCount: [],
            preMounted: false,
            laidOut: false
        };
    },
    onTagSelect: function (tag) {
        if (this.props.onTagSelect) {
            this.props.onTagSelect(tag);
        }
    },
    rearrange() {
        _.throttle( () => {
            this.setState({laidOut: false, preMounted: false});
            //call rearrange on each list that is contained in a tag (for sub tags)
            for(let tag of this.props.tags)
            {
                let ref = this.refs["tag-"+tag.name];
                if(ref){
                    ref.rearrangeSubTags();
                }
            }
        }, 100)();
    },
    componentDidMount() {
        window.addEventListener('resize', this.rearrange);
        this.layOut();
    },
    componentWillUnmount() {
        window.removeEventListener('resize', this.rearrange);
    },
    componentDidUpdate() {
        this.layOut();
    },
    layOut() {
        if(this.props.tags.length != this.state.lastSetTagsCount || !this.state.preMounted) {
            this.setState({
                lastSetTagsCount: this.props.tags.length,
                vTags: this.props.tags,
                preMounted: true,
                laidOut: false
            });
        }
        if(this.state.preMounted && !this.state.laidOut && this.props.isRoot) { //TODO: only for root now
            var element = ReactDOM.findDOMNode(this.refs.listparent);
            let visibleTags= [];
            let hiddenTags = [];
            let accountMenu = $(".account-container");
            for(var i=0; i< this.props.tags.length; i++)
            {
                var tag = this.props.tags[i];
                var tagElement = ReactDOM.findDOMNode(this.refs["tag-"+tag.name]);
                if(tagElement) {
                    if (tagElement.offsetTop + tagElement.offsetHeight >
                        element.offsetTop + element.offsetHeight ||
                        tagElement.offsetLeft + tagElement.offsetWidth >
                        element.offsetLeft + element.offsetWidth - accountMenu.width() - 50) {
                        hiddenTags.push(tag);
                    }
                    else {
                        visibleTags.push(tag);
                    }
                }
            }
            this.setState({
                vTags: visibleTags,
                hTags: hiddenTags,
                laidOut: true
            });
        }
    },
    render() {
        let className = "tag-list";
        let hostClassName = "tag-list-host";

        if(!this.props.isRoot) {
            className += " tag-list-sub";
            hostClassName += " tag-list-sub-host";
        }

        return (
            <div className={hostClassName}  ref="listparent">
                <div className={className}>
                    { this.state.vTags.map((tag) => {
                        return <Tag
                            ref={"tag-"+tag.name}
                            isRoot={this.props.isRoot}
                            isVisible={this.props.isVisible}
                            key={tag.name}
                            tag={tag}
                            isMobile={this.props.isMobile}
                            selected={tag.name==this.props.selectedTagName}
                            selectedTagName={this.props.selectedTagName}
                            openSettings={this.props.openSettings}
                            onTagSelect={this.onTagSelect}/>
                        })}
                </div>
                { this.state.hTags.length >0 && this.props.isVisible &&
                        <DropdownMenu className="more-tags-dropdown"
                                      HeaderClass="more-tags-dropdown-button"
                            Header="..."
                        >
                            { this.state.hTags.map((tag) => {
                                return <Tag
                                    ref={"tag-"+tag.name}
                                    isRoot={this.props.isRoot}
                                    isHidden={true}
                                    isVisible={this.props.isVisible}
                                    key={tag.name}
                                    tag={tag}
                                    isMobile={this.props.isMobile}
                                    selected={tag.name==this.props.selectedTagName}
                                    selectedTagName={this.props.selectedTagName}
                                    openSettings={this.props.openSettings}
                                    onTagSelect={this.onTagSelect}/>
                                })}
                        </DropdownMenu>
                }
            </div>
        )
    }
});