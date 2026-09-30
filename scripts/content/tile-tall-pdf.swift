import Foundation
import AppKit
import PDFKit
import Vision
let file=CommandLine.arguments[1],dir=CommandLine.arguments[2]
try FileManager.default.createDirectory(atPath:dir,withIntermediateDirectories:true)
let doc=PDFDocument(url:URL(fileURLWithPath:file))!
let page=doc.page(at:0)!, b=page.bounds(for:.mediaBox)
let scale=1400/b.width,step=1800/scale, count=Int(ceil(b.height/step))
var texts=[String]()
for i in 0..<count {
 let h=min(step+180/scale,b.height-CGFloat(i)*step),w=1400,pxH=Int(ceil(h*scale))
 let ctx=CGContext(data:nil,width:w,height:pxH,bitsPerComponent:8,bytesPerRow:w*4,space:CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGImageAlphaInfo.premultipliedLast.rawValue)!
 ctx.setFillColor(NSColor.white.cgColor);ctx.fill(CGRect(x:0,y:0,width:w,height:pxH));ctx.scaleBy(x:scale,y:scale);ctx.translateBy(x:0,y:-(b.height-CGFloat(i)*step-h));page.draw(with:.mediaBox,to:ctx)
 let img=ctx.makeImage()!,name=String(format:"%03d",i+1)
 try NSBitmapImageRep(cgImage:img).representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:dir+"/"+name+".png"))
 let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate;request.recognitionLanguages=["en-US"];try VNImageRequestHandler(cgImage:img).perform([request])
 texts.append("### TILE \(i+1)\n"+(request.results ?? []).compactMap{$0.topCandidates(1).first?.string}.joined(separator:"\n"))
}
try texts.joined(separator:"\n\n").write(toFile:dir+"/all.txt",atomically:true,encoding:.utf8)
print(file,count)
