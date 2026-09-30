import Foundation
import CoreGraphics
import ImageIO
import AppKit
// Extract original embedded figures, not page screenshots containing answer marks.
let pdf=CGPDFDocument(URL(fileURLWithPath:CommandLine.arguments[1]) as CFURL)!
let out=URL(fileURLWithPath:CommandLine.arguments[2])
try FileManager.default.createDirectory(at:out,withIntermediateDirectories:true)
var records:[[String:Any]]=[]
for index in 1...pdf.numberOfPages {
 let page=pdf.page(at:index)!, dictionary=page.dictionary!
 var resources:CGPDFDictionaryRef?,objects:CGPDFDictionaryRef?
 if !CGPDFDictionaryGetDictionary(dictionary,"Resources",&resources) { continue }
 if !CGPDFDictionaryGetDictionary(resources!,"XObject",&objects) { continue }
 var pageRecords:[[String:Any]]=[]
 let context=UnsafeMutablePointer<[[String:Any]]>.allocate(capacity:1)
 context.initialize(to:[])
 CGPDFDictionaryApplyFunction(objects!, {name,object,info in
  var stream:CGPDFStreamRef?
  guard CGPDFObjectGetValue(object,.stream,&stream),let stream=stream else{return}
  guard let dict=CGPDFStreamGetDictionary(stream) else{return}
  var subtype:UnsafePointer<CChar>?
  guard CGPDFDictionaryGetName(dict,"Subtype",&subtype),String(cString:subtype!)=="Image" else{return}
  var w:CGPDFInteger=0,h:CGPDFInteger=0
  CGPDFDictionaryGetInteger(dict,"Width",&w);CGPDFDictionaryGetInteger(dict,"Height",&h)
  guard w>120,h>120 else{return}
  var format=CGPDFDataFormat.raw
  guard let data=CGPDFStreamCopyData(stream,&format) else{return}
  let array=info!.assumingMemoryBound(to:[[String:Any]].self)
  array.pointee.append(["name":String(cString:name),"width":w,"height":h,"data":data as Data,"format":format == .jpegEncoded ? "jpg" : "raw"])
 },context)
 for row in context.pointee {
  let name=String(format:"%03d",index)+"-"+(row["name"] as! String)
  let data=row["data"] as! Data,ext=row["format"] as! String
  if ext=="jpg" {
   let file=out.appendingPathComponent(name+".jpg");try data.write(to:file)
   pageRecords.append(["page":index,"name":name,"width":row["width"]!,"height":row["height"]!,"path":file.path])
  } else {
   let w=row["width"] as! Int,h=row["height"] as! Int,components=data.count/(w*h)
   if data.count==w*h*components && [1,3].contains(components),let provider=CGDataProvider(data:data as CFData),let image=CGImage(width:w,height:h,bitsPerComponent:8,bitsPerPixel:components*8,bytesPerRow:w*components,space:components==1 ? CGColorSpaceCreateDeviceGray() : CGColorSpaceCreateDeviceRGB(),bitmapInfo:CGBitmapInfo(rawValue:0),provider:provider,decode:nil,shouldInterpolate:false,intent:.defaultIntent) {
    let file=out.appendingPathComponent(name+".png")
    if let dest=CGImageDestinationCreateWithURL(file as CFURL,"public.png" as CFString,1,nil){CGImageDestinationAddImage(dest,image,nil);CGImageDestinationFinalize(dest)
    pageRecords.append(["page":index,"name":name,"width":w,"height":h,"path":file.path])}
   }
  }
 }
 context.deinitialize(count:1);context.deallocate();records += pageRecords
}
try JSONSerialization.data(withJSONObject:records,options:[.prettyPrinted,.sortedKeys]).write(to:out.appendingPathComponent("images.json"))
print(records.count,"embedded figures")
