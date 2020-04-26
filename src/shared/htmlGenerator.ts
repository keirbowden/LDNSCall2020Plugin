import { join } from 'path';
import { DocumentorConfig } from './configtypes';
import { renderFile } from 'ejs';

class HTMLGenerator {
    generatedDate : string;
    config: DocumentorConfig;
    ejsTemplateDirName: string;

    constructor(config: DocumentorConfig, ejsTemplateDirName: string) {
        this.generatedDate=new Date().toISOString();
        this.config=config;
        this.ejsTemplateDirName=ejsTemplateDirName;
    }
    
    generateHTML(template: string, content: object) {

        let data={
                    content: content,
                    footer: 
                    {
                       generatedDate : this.generatedDate,
                       version : this.config.version
                    }
                 };
                    
        const templateFile=join(this.ejsTemplateDirName, template);

        return new Promise((resolve, reject) => {
            renderFile(templateFile, data, (err, html) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(html);
                }
            })
        })
    }

}

export {HTMLGenerator}