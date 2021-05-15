import { flags, SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { AnyJson } from '@salesforce/ts-types';
import { fileExists } from '../../shared/files';
import { defaultConfig } from '../../shared/defaultConfig';
import { Documentor } from '../../shared/documentor';
import { mkdirSync, readdirSync, copyFileSync } from 'fs';
import { join } from 'path';
import {fs} from '@salesforce/core';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('bbdoc', 'doc');

export default class Doc extends SfdxCommand {

  public static description = messages.getMessage('commandDescription');

  public static examples = [
  `$ sfdx bbdoc:doc --config ./config/bbdoc-config.jsob --report-dir ./report --source-dir force-app/main/default
Documenting Org
Documented Org
Report generated at report/index.html
`
  ];

  public static args = [{name: 'file'}];

  protected static flagsConfig = {
    // flag with a value (-n, --name=VALUE)
    "config": flags.string({char: 'c', description: messages.getMessage('configFlagDescription')}),
    "report-dir": flags.string({char: 'r', required: true, description: messages.getMessage('reportDirFlagDescription')}),
    "source-dir": flags.string({char: 's', required: true, description: messages.getMessage('sourceDirFlagDescription')})
  };

  // Comment this out if your command does not require an org username
  protected static requiresUsername = false;

  // Comment this out if your command does not support a hub org username
  protected static supportsDevhubUsername = false;

  // Set this to true if your command requires a project workspace; 'requiresProject' is false by default
  protected static requiresProject = false;

  public async run(): Promise<AnyJson> {
    // create the report directory, if it doesn't already exist
    const reportDir = this.flags['report-dir'];
    const imageDir = join(reportDir, 'images');
    if (!fileExists(reportDir)) {
      this.ux.log('Creating report directory ' + reportDir);
      mkdirSync(reportDir);
    }

    if (!fileExists(imageDir)) {
      this.ux.log('Creating imageDir directory ' + reportDir);
      mkdirSync(imageDir);
    }

    let sourceDir = this.flags['source-dir'];
    sourceDir = sourceDir.endsWith('/') ? sourceDir : sourceDir + '/';

    // load the config, using the default if nothing provided via flags
    let config;

    if (!this.flags.config) {
      this.ux.log('Using default configuration');
      config = defaultConfig;
    }
    else {
      config = await fs.readJson(this.flags.config);
    }

    // find the html templates
    const pluginRoot = await fs.traverseForFile(__dirname, 'package.json');
    const ejsTemplateDirName = join(pluginRoot, 'templates');

    const templateImageDir = join(ejsTemplateDirName, 'images');
    const imageFiles = readdirSync(templateImageDir);
    imageFiles.forEach(file => {
      copyFileSync(join(templateImageDir, file), join(imageDir, file));
    });

     // get the version
    const packageJSON = await fs.readFile(join(pluginRoot, 'package.json'), 'utf-8');
    const pkg = JSON.parse(packageJSON);
    config.version = pkg.version;
    const documentor = new Documentor(sourceDir, reportDir, config, ejsTemplateDirName);

    this.ux.log('Documenting Org');
    documentor.document();
    this.ux.log('Documented Org');
    this.ux.log('Report generated at ' + join(reportDir, 'index.html'));
    // Return an object to be displayed with --json
    return { success: true };
  }
}

