export default React.createClass({
    getInitialState(){
      return {
          isOpen: false
      }
    },
    componentWillMount() {
        document.addEventListener('click', this.handleClick, false);
    },
    componentWillUnmount() {
        document.removeEventListener('click', this.handleClick, false);
    },
    componentDidUpdate() {
        let header = $(this.refs.header);
        let dropDown = $(this.refs.dropdown);
        if(dropDown)
        {
            let windowWidth = $(window).width();
            let dropDownOffset = dropDown.offset();
            if(dropDownOffset) {
                let dropDownLeft = dropDownOffset.left;
                let outsideWindow = dropDownLeft + dropDown.width() - windowWidth;
                if (outsideWindow > 0) {
                    dropDown.css("margin-left", "-"+dropDown.width()+"px");
                } else {
                    dropDown.css("margin-left", null);
                }
            }
        }
    },
    handleClick: function (e) {
        var component = ReactDOM.findDOMNode(this.refs.component);
        if (e.target == component || $(component).has(e.target).length) {
            // Inside the component
        }
        else{
            // Outide
            this.setState({ isOpen: false});
        }
    },
    render()
    {
        return (
          <div ref="component" className={this.props.className}>
              <div ref="header" className={this.props.HeaderClass}
                  onClick={() => {
                    this.setState({ isOpen : !this.state.isOpen})
                    if(this.props.Clicked){
                        this.props.Clicked();
                    }
                  }
                  }>{this.props.Header}</div>
              {
                    this.state.isOpen && (
                        <div className="dropdown-menu"
                             ref="dropdown"
                             style={{ right: this.state.offsetLeft}}
                             onClick={() => this.setState({ isOpen : false})}>
                            {React.Children.map(this.props.children, (item) => item)}
                        </div>
                        )
              }
          </div>
        );
    }
});