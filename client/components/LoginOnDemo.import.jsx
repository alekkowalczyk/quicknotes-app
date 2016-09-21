export default React.createClass({
    render(){
        let loginGoogle = () => this.props.loginGoogle();
        let loginFacebook = () => this.props.loginFacebook();

        if(!this.props.isMobile) {
            return (
                <div>
                    <div>
                        Demo mode - notes are <strong>not</strong> saved,
                        <br/>
                        please sign in to keep your notes.
                    </div>
                    <div className="btn-login facebook" onClick={loginFacebook}>
                        <div className="btn-icon">
                            <i className="fa fa-facebook"></i>
                        </div>
                        Sign in with Facebook
                    </div>
                    <div className="btn-login google" onClick={loginGoogle}>
                        <div className="btn-icon">
                            <i className="fa fa-google"></i>
                        </div>
                        Sign in with Google
                    </div>
                </div>
            );
        }
        else{
            return (
                <div>
                    <div style={{float: "left", maxWidth: "70%"}}>
                        Demo mode - notes are <strong>not</strong> saved,
                        please sign in to keep your notes.
                    </div>
                    <div style={{float:"right"}}>
                        <div className="btn-login btn-login-mobile btn-icon btn-icon-mobile facebook" onClick={loginFacebook}>
                            <i className="fa fa-facebook"></i>
                        </div>
                        <div className="btn-login btn-login-mobile btn-icon btn-icon-mobile google" onClick={loginGoogle}>
                            <i className="fa fa-google"></i>
                        </div>
                    </div>
                </div>
            );
        }
    }
});