import DropdownMenu from './DropdownMenu';

export default class MainMenu extends React.Component {
    render() {
        let header = (this.props.isMobile) ? (
            <span><i className="fa fa-gear"></i>&nbsp;<i className="fa fa-caret-down"></i></span>
        ):(
            <span><i className="fa fa-gear"></i>&nbsp;{this.props.username}&nbsp;<i className="fa fa-caret-down"></i></span>
        );
        return (
        <div  className="account-container">
            <DropdownMenu
                Clicked={()=>{
                    if(this.props.Clicked){
                        this.props.Clicked();
                    }
                }}
                HeaderClass="account-header"
                Header={header}
            >
                <div className="dropdown-menu-item">
                    <div onClick={() => this.props.getModalManager().openGeneralSettings()}>
                        <i style={{width:".8em"}} className="fa fa-gear"></i> Global settings
                    </div>
                </div>
                <div className="dropdown-menu-item">
                    <div onClick={() => this.props.getModalManager().openTagManager()}>
                        <i style={{width:".8em"}} className="fa fa-hashtag"></i> Tag settings
                    </div>
                </div>
                <hr/>
                <div className="dropdown-menu-item">
                    <div onClick={() => this.props.getModalManager().openContactModal()}>
                        <i style={{width:".8em"}} className="fa fa-envelope-o"></i> Contact
                    </div>
                </div>
                <div className="dropdown-menu-item">
                    <div onClick={() => this.props.getModalManager().openAboutModal()}>
                        <i style={{width:".8em"}} className="fa fa-info"></i> About
                    </div>
                </div>
                <hr/>
                <div  className="dropdown-menu-item" onClick={()=>this.props.logout()}>
                    <i style={{width:".8em"}} className="fa fa-chain-broken"></i> Log out
                </div>
            </DropdownMenu>
        </div>);
    }
}