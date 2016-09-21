import Note from './Note';
import Settings from '../../lib/Settings';

export default React.createClass({
    componentDidMount(){
        if(!this.props.isDemoMode) {
            ga('send', 'pageview', '/notes/');
        }
      if(!CodeMirror.modes.quicknotes){
          CodeMirror.defineMode("quicknotes", function(config, parserConfig) {
              var quicknotesOverlay = {
                  token: function(stream,state) {
                      if (stream.match(/#\S+/) ) {
                          return "hashtag-inline";
                      } else {
                          stream.next();
                          return null;
                      }
                  }
              };
              return CodeMirror.overlayMode(CodeMirror.getMode(config, "gfm"), quicknotesOverlay);
          });
      }
    },
    componentDidUpdate(){
    },
    renderNotes() {
        // Get notes from this.data.notes
        return this.props.notes.map((note) => {
            return <Note
                allTags={this.props.tags}
                key={note._id}
                isMobile={this.props.isMobile}
                isMobileSmall={this.props.isMobileSmall}
                tagListRefresh={this.props.tagListRefresh}
                updateMasonryHackCallback={()=> {
                    if(this.masonry) {
                        setTimeout(()=> this.masonry.performLayout(), 10);
                    }
                }} // some hack
                note={note} />;
        });
    },
    masonryOptions: {
        itemSelector: '.note',
        columnWidth: 300,
        isFitWidth: true,
        transitionDuration: '90ms'
    },
    render() {
        let moreClick = () => {
            Session.set("itemsLimit", Session.get('itemsLimit') + Settings.ItemsLimit);
        };

        let isMore = false;
        if(this.props.notes) {
            isMore = this.props.notes.length >= Session.get("itemsLimit");
        }
        return (
            <div>
                { this.props.isMobile ? (
                    <div>{this.renderNotes()}</div>
                    ):(
                    <Masonry ref={(r) => this.masonry = r} options={this.masonryOptions}>
                        {this.renderNotes()}
                    </Masonry>
                )}

                {
                    isMore && (
                    <div className="more-notes-button" onClick={moreClick}>More...</div>
                    )
                }
            </div>
        );
    }
});