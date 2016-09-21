export default React.createClass({
    getInitialState() {
      return {
          value: ""
      };
    },
    submit(){
        if(this.state.value!="") {
            Meteor.call("sendEmail", this.state.value);
            this.props.closeModal();
        }
    },
    handleChange(event) {
        this.setState({value: event.target.value.substr(0, 5400)});
    },
    render(){
        return (<Modal
            isOpen={this.props.isOpen}
            ionClose={true}
            close={this.props.closeModal}
            title="Contact"
        >
            <h5 style={{margin: '.2em'}} className="left">We would appreciate your feedback to make quicknotes better.</h5>
            <div style={{margin: '.2em'}}>Contact us through one of our social media sites...</div>
            <div className="left social-box">
                <div><a className="social-link" target="_blank" href="http://fb.com/simplequicknotes"><i className="fa fa-facebook social-icon facebook-color"></i>fb.com/simplequicknotes</a></div>
                <div><a className="social-link" target="_blank" href="https://twitter.com/quicknot_es"><i className="fa fa-twitter social-icon twitter-color"></i>twitter.com/quicknot_es</a></div>
            </div>
            <div style={{margin: '.2em'}}>...or directly here</div>
            <textarea placeholder="Write your message here..." style={{ width: '99%'}} rows="10" onChange={this.handleChange}></textarea>
            <div>
                <button style={{float: 'right'}} className="small-button" onClick={this.submit}>Send</button>
                <div className="clear"></div>
            </div>
        </Modal>);
    }
});