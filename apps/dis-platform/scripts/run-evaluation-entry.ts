import {evaluationConfig,runEvaluation} from './run-synthesis-evaluation';
import {runFiveCycles} from './run-five-cycle-evaluation';
const config=evaluationConfig(process.env);
if(!config)console.log('DIS_EVAL_INACTIVE: no exact-head preview evaluation authorization.');
else (process.env.DIS_EVAL_MODE==='five-cycles'?runFiveCycles(config):runEvaluation(config)).catch(()=>{console.error('DIS_EVAL_BLOCKED_UNEXPECTED_ERROR');process.exitCode=1;});
