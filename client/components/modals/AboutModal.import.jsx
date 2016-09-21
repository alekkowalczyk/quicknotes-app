export default React.createClass({
    render(){
        return (<Modal
            id="generalSettingsModal"
            isOpen={this.props.isOpen}
            ionClose={true}
            close={this.props.closeModal}
            title={<span>Quicknotes<div className="beta-title">BETA</div></span>}
        >
            <h5 className="center">Version 0.8.1</h5>
            <h4 className="center">Simple and easy notes in the cloud</h4>
            <h5 className="center">Organized with <span className="cm-hashtag-inline">#hierarchic.hashtags</span></h5>
            <hr/>
            <div className="social-box">
                <div><a className="social-link" target="_blank" href="http://fb.com/simplequicknotes"><i className="fa fa-facebook social-icon facebook-color"></i>fb.com/simplequicknotes</a></div>
                <div><a className="social-link" target="_blank" href="https://twitter.com/quicknot_es"><i className="fa fa-twitter social-icon twitter-color"></i>twitter.com/quicknot_es</a></div>
            </div>
        </Modal>);
    }
});