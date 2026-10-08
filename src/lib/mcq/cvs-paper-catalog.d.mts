import type {DownloadCollection} from '../../components/PaperDownloads';
import type {PaperTopicMap} from './cvs-paper-state.mjs';
import type {CvsScope} from './cvs-scope.mjs';
export function cvsTopicMapReady(topicMap:unknown):topicMap is PaperTopicMap;
export function scopeCvsDownloadCollection<T extends DownloadCollection>(collection:T,scope:CvsScope,topicMap?:PaperTopicMap|null):T;
