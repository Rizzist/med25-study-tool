export type ExportBlock={number:string;id:string;paragraphs:string[];options:Array<{letter:string;text:string}>;fields:Record<string,string>};
export type ParsedExport={title:string;intro:string[];meta:Record<string,string>;sources:Array<{name:string;url:string;note:string}>;questions:ExportBlock[];keys:ExportBlock[];keyIntro:string[]};
export function parseExport(markdown:string):ParsedExport;
export function keyOf(block:ExportBlock):{letter:string;text:string};
