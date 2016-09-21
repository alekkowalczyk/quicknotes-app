import AccountsUIWrapper from './AccountsUIWrapper';

export default React.createClass({
    componentDidMount(){
        ga('send', 'pageview', '/login/');
    },
   render(){
       let loginGoogle = () => this.props.loginGoogle();
       let loginFacebook = () => this.props.loginFacebook();
       let enableDemoMode = () => this.props.enableDemoMode();
        //<AccountsUIWrapper />
       return (
       <div className="login-page">
           <div className="login-panel-host">
               <div className="login-panel">
                   <h1>Quicknot<span className="dot-es"><span className="dot">.</span><span className="es">es</span></span><div className="beta-title beta-title-login-panel">beta</div></h1>
                   <h3 className="center">Simple and easy notes in the cloud</h3>
                   <h4 className="center">Organized with <span className="hashtag-inline">#hierarchic.hashtags</span></h4>
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
                   <div className="btn-login btn-demo" onClick={enableDemoMode}>
                       <div className="btn-icon btn-icon-demo">
                           <i className="fa fa-eye"></i>
                       </div>
                       Try out the demo
                   </div>
               </div>
               <div className="social-box">
                   <div><a className="social-link" target="_blank" href="http://fb.com/simplequicknotes"><i className="fa fa-facebook social-icon facebook-color"></i>fb.com/simplequicknotes</a></div>
                   <div><a className="social-link" target="_blank" href="https://twitter.com/quicknot_es"><i className="fa fa-twitter social-icon twitter-color"></i>twitter.com/quicknot_es</a></div>
               </div>
           </div>
           <div style={{float: "left", verticalAlign: top, color: 'white'}}>

           </div>
           <div className="a7plus-logo">
               <a href="http://a7pl.us/" target="_blank"> <img height="32" src="\a7plus_logo.png"></img></a>
           </div>
       </div>
       );
   }     
});