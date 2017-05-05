import GeneralSettingsModal from './modals/GeneralSettingsModal';
import TagManagerModal from './modals/TagManagerModal';
import AboutModal from './modals/AboutModal';
import ContactModal from './modals/ContactModal';

export default class ModalManager extends React.Component {
    constructor() {
        super();
        this.state = {
            isGeneralSettingsOpen: false,
            isTagManagerOpen: false,
            isAboutOpen: false,
            isContactOpen: false
        };
        this.tagManager = null;
    }

    openGeneralSettings() : void {
        this.setState({ isGeneralSettingsOpen: true});
    }

    openTagManager() : void {
        this.tagManager.refreshTags();
        //this.refs.tagManagerModalDialog.refreshTags();
        this.setState({ isTagManagerOpen: true });
    }

    openAboutModal() {
        this.setState({ isAboutOpen: true});
    }

    openContactModal() {
        this.setState({ isContactOpen: true});
    }

    render(){
        return (
            <div>
                <AboutModal
                   isOpen={this.state.isAboutOpen}
                   closeModal={() => {
                        this.setState({
                            isAboutOpen: false
                        })
                   }}
                    />
                <GeneralSettingsModal
                    isOpen={this.state.isGeneralSettingsOpen}
                    closeModal={() => {
                            this.setState({
                                isGeneralSettingsOpen: false
                            })
                    }}
                />
                <GeneralSettingsModal
                    isOpen={this.state.isGeneralSettingsOpen}
                    closeModal={() => {
                            this.setState({
                                isGeneralSettingsOpen: false
                            })
                    }}
                />
                <ContactModal
                    isOpen={this.state.isContactOpen}
                    closeModal={() => {
                            this.setState({
                                isContactOpen: false
                            })
                    }}
                />
                <TagManagerModal
                    modalManager={this}
                    isOpen={this.state.isTagManagerOpen}
                    closeModal={() => {
                        this.setState({
                            isTagManagerOpen: false
                        })
                    }}
                    tagListRefresh={this.props.tagListRefresh}
                    updateRootTags={this.props.updateRootTags}
                    tags={this.props.tags}
                />
            </div>
        );
    }
}