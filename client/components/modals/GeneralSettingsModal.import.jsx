export default React.createClass({
    exportAllData(){
        Meteor.call("exportData", (error, result) => {
            // TODO: clone the json and remove owner and other not relevant data
            var blob = new Blob([JSON.stringify(result)], { type: 'application/json'});
            let filename = 'quicknotes_export_'+(new Date()).toISOString().replace('-','').replace('.','').replace(':','')+'.qnj';
            saveAs(blob, filename);
        });
    },
    importFromFile() {
        $('input[type=file]').trigger('click');
    },
    importFileSelected(e) {
        var file = $('input[type=file]')[0].files[0];
        if(file){
            var reader = new FileReader(); // HTML5
            reader.onload = (e) => {
                Meteor.call("importData", e.target.result, (error, result) => {
                    if(result == "OK") {
                        this.props.closeModal();
                    }
                    else{
                        alertify.alert(result);
                    }
                });
            }
            reader.readAsDataURL(file);
        }
    },
    render(){
        let generalSettingsModalBody = (<div>
            <div><button style={{ width: '97%'}} className="small-button" onClick={this.exportAllData}>Export data</button></div>
            <div><button style={{ width: '97%'}} className="small-button" onClick={this.importFromFile}>Import from file</button></div>
            <input id="fileToImport" type="file" ref="fileUpload"  onChange={this.importFileSelected}
                   accept=".qnj"
                   hidden style={{opacity: '0', display: 'none'}} />
        </div>);
        //let filename = 'quicknotes_export_'+(new Date()).toISOString().replace('-','').replace('.','').replace(':','')+'.json';
        //<div><button className="small-button"><a href="export" style={{textDecoration: 'none', color:'rgb(255, 255, 255)'}} download={filename}>Export data</a></button></div>
        return (<div><Modal
            id="generalSettingsModal"
            ionClose={true}
            isOpen={this.props.isOpen}
            close={this.props.closeModal}
            title="Settings"
            content={generalSettingsModalBody}
        >
        </Modal></div>);
    }
});