import Foundation
import Vision
import AppKit
let input=CommandLine.arguments[1], output=CommandLine.arguments[2]
let files=try FileManager.default.contentsOfDirectory(atPath:input).filter{$0.hasSuffix(".jpg")}.sorted()
var pages:[[String:Any]]=[]
for name in files {
 let url=URL(fileURLWithPath:input).appendingPathComponent(name)
 guard let img=NSImage(contentsOf:url) else {continue}
 var rect=CGRect(origin:.zero,size:img.size)
 guard let cg=img.cgImage(forProposedRect:&rect,context:nil,hints:nil) else {continue}
 let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate; request.recognitionLanguages=["en-US"]
 try VNImageRequestHandler(cgImage:cg).perform([request])
 let lines=(request.results ?? []).map { obs -> [String:Any] in
 let r=obs.boundingBox
 return ["text":obs.topCandidates(1).first?.string ?? "", "box":[r.minX,1-r.maxY,r.maxX,1-r.minY]]
 }
 pages.append(["file":name,"lines":lines])
 print("Read \(name)")
}
try JSONSerialization.data(withJSONObject:pages,options:[.prettyPrinted,.sortedKeys]).write(to:URL(fileURLWithPath:output))
