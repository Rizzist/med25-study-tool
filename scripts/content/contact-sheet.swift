import Foundation
import AppKit
let paths=CommandLine.arguments.dropFirst(2), output=CommandLine.arguments[1]
let cellW=380,cellH=360,columns=3,rows=(paths.count+2)/3
let image=NSImage(size:NSSize(width:cellW*columns,height:cellH*rows))
image.lockFocus();NSColor.white.setFill();NSRect(x:0,y:0,width:cellW*columns,height:cellH*rows).fill()
for (i,path) in paths.enumerated(){
 guard let thumb=NSImage(contentsOfFile:path) else{continue}
 let scale=min(CGFloat(cellW-16)/thumb.size.width,CGFloat(cellH-30)/thumb.size.height)
 let x=(i%columns)*cellW, y=(rows-1-i/columns)*cellH
 thumb.draw(in:NSRect(x:CGFloat(x)+8,y:CGFloat(y)+8,width:thumb.size.width*scale,height:thumb.size.height*scale))
 (URL(fileURLWithPath:path).lastPathComponent as NSString).draw(at:NSPoint(x:x+8,y:y+cellH-22),withAttributes:[.font:NSFont.boldSystemFont(ofSize:14),.foregroundColor:NSColor.black])
}
image.unlockFocus()
try NSBitmapImageRep(data:image.tiffRepresentation!)!.representation(using:.png,properties:[:])!.write(to:URL(fileURLWithPath:output))
