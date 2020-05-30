import { getStandardValueSetName, getStandardValueSet, getGlobalValueSet } from "../../valuesets";

let enrichField= (objectName, field, parentDir) => {
    var fqName=objectName+'.'+field.fullName;
    field.svsName=getStandardValueSetName[fqName];
    if (field.svsName) {
        field.standardValueSet=true;
        field.svs=getStandardValueSet(parentDir, field.svsName);
    }
    else if ( (field.valueSet) && (field.valueSet.valueSetName) ) {
        field.gvs=getGlobalValueSet(parentDir, field.valueSet.valueSetName);
        field.globalValueSet=true;
    }
}


let addAdditionalFieldInfo = (field, type) => {
    var result='';
    if (type) {
        switch (type.toString()) {
            case 'Lookup':
                result += '<strong>Lookup</strong> : ' + field.referenceTo;
                break;
    
            case 'MasterDetail':
                result += '<strong>Master-Detail</strong> : ' + field.referenceTo;
                break;
    
            case 'Summary':
                result += '<strong>Roll Up Summary</strong> : ' + field.summaryOperation + '(' + field.summaryForeignKey + ')';
                break;
    
            case 'Html':
            case 'LongTextArea':
                result += '<strong>Length</strong> : ' + field.length + '<br/>';
                result += '<strong>Visible Lines</strong> : ' + field.visibleLines;
                break;

            case 'Picklist':
            case 'MultiselectPicklist':
                if (field.standardValueSet) {
                    result+='<b>Standard Value Set (' + field.svsName + ')</b><br/>';
                    if (field.svs) {
                        if (field.svs.StandardValueSet.standardValue) {
                            for (var idx=0; idx<field.svs.StandardValueSet.standardValue.length; idx++) {
                                var value=field.svs.StandardValueSet.standardValue[idx].fullName + '<br/>';
                                result+='&nbsp;&nbsp;' + value;
                            }
                        }
                    }
                    else {
                        result+='Not version controlled';
                    }
                }
                else if (field.valueSet) {
                    if (field.globalValueSet) {
                        var vsName=field.valueSet.valueSetName;
                        result+='<b>Global Value Set (' + vsName +')</b><br/>';
                        if (field.gvs) {
                            field.gvs.GlobalValueSet.customValue.forEach(item => result+='&nbsp;&nbsp;' + item.fullName + '<br/>');
                        }
                        else {
                            result+='Not version controlled';
                        }
                    }
                    else if (field.valueSet.valueSetDefinition) {
                        result+='<b>Values</b><br/>';
                        if (!(field.valueSet.valueSetDefinition.value instanceof Array)) {
                            field.valueSet.valueSetDefinition.value=[field.valueSet.valueSetDefinition.value];
                        }
                        field.valueSet.valueSetDefinition.value.forEach(item => {result+='&nbsp;&nbsp;' + item.fullName + '<br/>'});
                    }
                }
                break;
            case 'Text':
                result += '<strong>Length</strong> : ' + field.length;
                break;

            default:
                if (field.formula) {
                    result+='<strong>Formula</strong>: <br/>' + field.formula;
                }
        }
    }

    return result;
}

export { enrichField, addAdditionalFieldInfo }