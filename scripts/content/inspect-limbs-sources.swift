// Local-only PDF/image inspection. OCR is a draft, never an answer-key source.
import Foundation
import PDFKit
import Vision
import AppKit

let input = URL(fileURLWithPath: CommandLine.arguments[1])
let output = URL(fileURLWithPath: CommandLine.arguments[2])
let fm = FileManager.default
try fm.createDirectory(at: output, withIntermediateDirectories: true)
let paths = try JSONSerialization.jsonObject(with: Data(contentsOf: input)) as! [String]
for (fi, path) in paths.enumerated() {
  let folder = output.appendingPathComponent(String(format: "%03d", fi + 1))
  try fm.createDirectory(at: folder, withIntermediateDirectories: true)
  let url = URL(fileURLWithPath: path)
  let pdf = path.lowercased().hasSuffix(".pdf") ? PDFDocument(url: url) : nil
  let count = pdf?.pageCount ?? 1
  var pages: [[String: Any]] = []
  for i in 0..<count {
    let imageURL = folder.appendingPathComponent(String(format: "%03d.png", i + 1))
    let jsonURL = folder.appendingPathComponent(String(format: "%03d.json", i + 1))
    if fm.fileExists(atPath: jsonURL.path) {
      pages.append(try JSONSerialization.jsonObject(with: Data(contentsOf: jsonURL)) as! [String:Any]); continue
    }
    let image = pdf?.page(at: i)?.thumbnail(of: NSSize(width: 1800, height: 2400), for: .mediaBox) ?? NSImage(contentsOf: url)
    guard let image else { continue }
    var rect = CGRect(origin: .zero, size: image.size)
    guard let cg = image.cgImage(forProposedRect: &rect, context: nil, hints: nil) else { continue }
    try NSBitmapImageRep(cgImage: cg).representation(using: .png, properties: [:])!.write(to: imageURL)
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.usesLanguageCorrection = false
    request.recognitionLanguages = ["en-US"]
    try VNImageRequestHandler(cgImage: cg).perform([request])
    let lines: [[String:Any]] = (request.results ?? []).compactMap { r in
      guard let c = r.topCandidates(1).first else { return nil }
      return ["text":c.string,"confidence":c.confidence,"x":r.boundingBox.minX,"y":1-r.boundingBox.maxY,"width":r.boundingBox.width,"height":r.boundingBox.height]
    }
    let native = pdf?.page(at: i)?.string ?? ""
    let text = lines.map { $0["text"] as! String }.joined(separator: "\n")
    let row: [String:Any] = ["page":i+1,"file":path,"image":imageURL.path,"text":text,"nativeText":native,"lines":lines]
    try JSONSerialization.data(withJSONObject: row, options: [.prettyPrinted,.sortedKeys]).write(to: jsonURL)
    pages.append(row)
  }
  try JSONSerialization.data(withJSONObject: ["file":path,"pages":pages], options:[.prettyPrinted,.sortedKeys]).write(to: folder.appendingPathComponent("pages.json"))
  try pages.map { "### PAGE \($0["page"]!)\n\($0["text"]!)" }.joined(separator:"\n\n").write(to: folder.appendingPathComponent("all.txt"), atomically:true, encoding:.utf8)
  print(fi+1, url.lastPathComponent, count)
}
