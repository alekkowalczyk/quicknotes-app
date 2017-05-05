import App from './components/App';
import Settings from '../lib/Settings';

if (Meteor.isClient) {

    // This code is executed on the client only
    Session.setDefault("itemsLimit", Settings.ItemsLimit);
    Deps.autorun(() => {
        Meteor.subscribe("notes");
        Meteor.subscribe("tags");
        Meteor.subscribe("userdata");
    });
    Meteor.startup(function () {
        // Use Meteor.startup to render the component after the page is ready
        ReactDOM.render(<App />, document.getElementById("render-target"));
    });
}
