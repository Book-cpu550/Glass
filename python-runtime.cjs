const {MatlabRuntime,PYTHON_VERSION}=require('./matlab-runtime.cjs');
const VERSION=PYTHON_VERSION,DIRECTORY='python-'+VERSION;
class PythonRuntime extends MatlabRuntime{constructor(options){super({...options,language:'python'});}}
module.exports={VERSION,DIRECTORY,PythonRuntime};
