import Foundation
import PDFKit
// Extract native lines with physical bounds: reading order alone cannot assign a checkmark.
let pdf = PDFDocument(url: URL(fileURLWithPath: CommandLine.arguments[1]))!
var pages: [[String:Any]] = []
for i in 0..<pdf.pageCount {
  let page = pdf.page(at:i)!, text = (pdf.page(at:i)!.string ?? "") as NSString
  var rows: [[String:Any]] = [], offset = 0
  for line in (text as String).components(separatedBy:"\n") {
    let length = (line as NSString).length
    if length > 0, let selection = page.selection(for:NSRange(location:offset,length:length)) {
      let b = selection.bounds(for:page)
      rows.append(["text":line,"x":b.minX,"y":b.minY,"width":b.width,"height":b.height])
    }
    offset += length + 1
  }
  pages.append(["page":i+1,"lines":rows])
}
let data = try JSONSerialization.data(withJSONObject:pages,options:[.prettyPrinted,.sortedKeys])
try data.write(to:URL(fileURLWithPath:CommandLine.arguments[2]))
