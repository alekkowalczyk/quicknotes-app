let {  DropTarget, DragSource } = ReactDnD;

const tagSource = {
    beginDrag(props) {
        return {
            id: props.id,
            originalIndex: props.findTag(props.id).index
        };
    },

    endDrag(props, monitor) {
        const { id: droppedId, originalIndex } = monitor.getItem();
        const didDrop = monitor.didDrop();

        if (!didDrop) {
            props.moveTag(droppedId, originalIndex);
        }
        else {
            props.orderChanged(droppedId, originalIndex);
        }
    }
};

const tagTarget = {
    canDrop() {
        return false;
    },

    hover(props, monitor) {
        const { id: draggedId } = monitor.getItem();
        const { id: overId } = props;

        if (draggedId !== overId) {
            const { index: overIndex } = props.findTag(overId);
            props.moveTag(draggedId, overIndex);
        }
    }
};

@DropTarget("tag", tagTarget, connect => ({
    connectDropTarget: connect.dropTarget()
}))
@DragSource("tag", tagSource, (connect, monitor) => ({
    connectDragSource: connect.dragSource(),
    connectDragPreview: connect.dragPreview(),
    isDragging: monitor.isDragging()
}))

export default class TagManagerItem extends React.Component {

    render() {
        const { tag, setCurrentTag, deleteTag } = this.props;
        const { isDragging, connectDragSource, connectDragPreview, connectDropTarget } = this.props;
        const opacity = isDragging ? 0 : 1;

        return connectDragPreview(connectDropTarget(
            <div style={{opacity}} key={tag.name} className="tag-manager-item">
                { tag.subHashes && tag.subHashes.length>0 && <div className="tag-manager-item-button" onClick={() => setCurrentTag(tag, true)}><i className="fa fa-angle-double-down"></i></div>}

                <div className="tag-manager-tag">{tag.name}</div>
                {  this.props.mode == 'reorder' && connectDragSource(<div className="tag-manager-item-button" style={{cursor: 'move'}} ><i className="fa fa-arrows"></i></div>)}
                { this.props.mode == 'delete' && (
                    <div className="tag-manager-item-button" style={{ color: "#FF9189"}} onClick={() => deleteTag(tag)}><i className="fa fa-close"></i></div>
                )}
            </div>
        ));
    }
}

TagManagerItem.propTypes = {
    setCurrentTag: React.PropTypes.func.isRequired,
    deleteTag: React.PropTypes.func.isRequired,
    tag: React.PropTypes.object.isRequired
};
