from pathlib import Path
from docx import Document
from docx.shared import Cm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs' / 'Bao_cao_Chuong_4_Ket_qua_va_danh_gia.docx'
doc = Document()
sec = doc.sections[0]
sec.page_width, sec.page_height = Cm(21), Cm(29.7)
sec.top_margin, sec.bottom_margin = Cm(2), Cm(2)
sec.left_margin, sec.right_margin = Cm(3), Cm(2)
sec.footer_distance = Cm(1)

for name in ['Normal', 'Title', 'Heading 1', 'Heading 2', 'Heading 3', 'Caption']:
    style = doc.styles[name]
    style.font.name = 'Times New Roman'
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.element.get_or_add_rPr().rFonts.set(qn('w:eastAsia'), 'Times New Roman')
normal = doc.styles['Normal']
normal.font.size = Pt(13)
normal.paragraph_format.line_spacing = 1.35
normal.paragraph_format.space_after = Pt(6)
normal.paragraph_format.first_line_indent = Cm(.75)
normal.paragraph_format.widow_control = True
for name, size in [('Heading 1', 14), ('Heading 2', 13), ('Heading 3', 13)]:
    s = doc.styles[name]
    s.font.size = Pt(size)
    s.font.bold = True
    s.paragraph_format.space_before = Pt(10)
    s.paragraph_format.space_after = Pt(6)
    s.paragraph_format.first_line_indent = Cm(0)
    s.paragraph_format.keep_with_next = True
    s.paragraph_format.line_spacing = 1.15
doc.styles['Title'].font.size = Pt(16)
doc.styles['Title'].font.bold = True
doc.styles['Title'].paragraph_format.space_after = Pt(14)
doc.styles['Title'].paragraph_format.first_line_indent = Cm(0)
doc.styles['Title'].paragraph_format.line_spacing = 1.15
doc.styles['Caption'].font.size = Pt(12)
doc.styles['Caption'].font.italic = True
doc.styles['Caption'].paragraph_format.first_line_indent = Cm(0)
doc.styles['Caption'].paragraph_format.space_after = Pt(9)

def p(text):
    para = doc.add_paragraph(text)
    para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    return para

def h(text, level=1):
    return doc.add_paragraph(text, f'Heading {level}')

def lead(title, text):
    para = doc.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    para.add_run(title + ' ').bold = True
    para.add_run(text)
    return para

figures = []
def fig(title):
    n = len(figures) + 1
    figures.append(title)
    para = doc.add_paragraph('[Hình giao diện: ' + title + ']')
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    para.paragraph_format.first_line_indent = Cm(0)
    para.paragraph_format.space_before = Pt(5)
    para.paragraph_format.space_after = Pt(3)
    para.paragraph_format.keep_with_next = True
    para.runs[0].italic = True
    cap = doc.add_paragraph(f'Hình 4.{n}. {title}', 'Caption')
    cap.alignment = WD_ALIGN_PARAGRAPH.CENTER

title = doc.add_paragraph('CHƯƠNG 4: KẾT QUẢ ĐẠT ĐƯỢC\nVÀ ĐÁNH GIÁ', 'Title')
title.alignment = WD_ALIGN_PARAGRAPH.CENTER
p('Hệ thống website NEU Debate Club được xây dựng nhằm kết hợp giới thiệu hình ảnh câu lạc bộ với hỗ trợ quản lý hoạt động nội bộ. Kết quả triển khai bao gồm khu vực thông tin công khai và khu vực quản trị dành cho thành viên theo quyền truy cập. Chương này trình bày các giao diện tiêu biểu, tổng hợp chức năng đã xây dựng, phân tích ưu điểm và hạn chế của hệ thống, đồng thời đề xuất hướng phát triển trong giai đoạn tiếp theo.')

h('4.1. Giao diện ứng dụng')
p('Giao diện được tổ chức thành hai khu vực: trang giới thiệu dành cho người truy cập và bảng điều khiển dành cho thành viên câu lạc bộ. Khu vực quản trị sử dụng thanh điều hướng theo nhóm nghiệp vụ, kết hợp bảng dữ liệu, bộ lọc và biểu mẫu thao tác. Các chức năng hiển thị phụ thuộc vào vai trò và quyền được cấp; bố cục có điều chỉnh theo kích thước màn hình để hỗ trợ sử dụng trên máy tính và thiết bị di động.')

h('4.1.1. Trang giới thiệu câu lạc bộ', 2)
p('Trang chủ cung cấp thông tin tổng quan về NEU Debate Club, định hướng hoạt động, các ban chuyên môn, dự án và thành tích. Người truy cập có thể xem danh sách và nội dung chi tiết của dự án, thành tích hoặc tìm hiểu từng ban. Những nội dung này được liên kết với công cụ quản trị nội dung, giúp người phụ trách cập nhật thông tin mà không phải chỉnh sửa trực tiếp mã nguồn giao diện.')
p('Khu vực thông báo trên trang giới thiệu hỗ trợ hiển thị thông tin chương trình và nút đăng ký tham gia khi thông báo đã được liên kết với một sự kiện. Người đăng ký sử dụng tài khoản Google để xác thực danh tính. Cách bố trí này tạo điểm tiếp cận chung cho sinh viên quan tâm đến câu lạc bộ và các hoạt động đang được giới thiệu.')
fig('Trang chủ giới thiệu NEU Debate Club')

h('4.1.2. Đăng nhập và truy cập hệ thống', 2)
p('Giao diện đăng nhập sử dụng Google OAuth để xác thực người dùng. Đối với khu vực quản trị, tài khoản phải tương ứng với thành viên đang hoạt động trong hệ thống. Sau khi xác thực, người dùng được cung cấp phiên truy cập và danh sách chức năng phù hợp. Tài khoản Google của khách có thể phục vụ đăng ký sự kiện, nhưng không đồng nghĩa với việc được cấp quyền quản trị nội bộ.')
fig('Đăng nhập bằng tài khoản Google')

h('4.1.3. Trang tổng quan và theo dõi hoạt động', 2)
p('Trang tổng quan tập hợp công việc cá nhân, các nhiệm vụ cần chú ý, sự kiện và thông báo mới. Trưởng ban và Ban Chủ nhiệm có thể theo dõi thêm công việc trong phạm vi được quản lý; dữ liệu tài chính chỉ được hiển thị khi người dùng có quyền tương ứng. Các lối tắt giúp truy cập nhanh thao tác thường dùng như giao việc, tạo thông báo hoặc thêm giao dịch.')
p('Bên cạnh trang tổng quan, các màn hình biểu đồ và Health dashboard tổng hợp dữ liệu công việc, thành viên, sự kiện, tài chính và hoạt động theo khoảng thời gian. Các chỉ số hỗ trợ nhận diện nhiệm vụ quá hạn, phân bố khối lượng công việc và tình hình hoạt động; ý nghĩa của kết quả phụ thuộc vào mức độ đầy đủ của dữ liệu được cập nhật.')
fig('Trang tổng quan quản trị')
fig('Biểu đồ theo dõi hoạt động và Health dashboard')

h('4.1.4. Quản lý thành viên và nhiệm kỳ', 2)
p('Màn hình thành viên trình bày thông tin nhân sự theo dạng bảng, bao gồm họ tên, email, mã sinh viên, số điện thoại, ban, vai trò và trạng thái hoạt động. Các thao tác tìm kiếm, thêm mới và chỉnh sửa giúp người phụ trách duy trì danh sách thành viên tập trung. Việc quản lý tài khoản gắn với dữ liệu nhân sự cũng hỗ trợ kiểm soát quyền truy cập khi có thay đổi về vai trò hoặc trạng thái thành viên.')
p('Màn hình nhiệm kỳ hỗ trợ tạo nhiệm kỳ và quản lý danh sách thành viên gắn với từng nhiệm kỳ. Dữ liệu được phân tách theo giai đoạn hoạt động, tạo cơ sở tra cứu nhân sự và hỗ trợ bàn giao giữa các thế hệ. Đây là phần bổ sung cho danh sách thành viên hiện tại, giúp lưu lại mối liên hệ giữa thành viên và từng giai đoạn của câu lạc bộ.')
fig('Danh sách và biểu mẫu quản lý thành viên')
fig('Quản lý nhiệm kỳ và thành viên theo nhiệm kỳ')

h('4.1.5. Giao việc và cập nhật tiến độ', 2)
p('Nhóm giao diện công việc gồm danh sách việc cá nhân, giao nhiệm vụ trong ban và giao nhiệm vụ liên ban theo quyền được cấp. Khi tạo công việc, người phụ trách có thể nhập nội dung, chọn người nhận, thời hạn, mức ưu tiên và sự kiện liên quan. Thành viên theo dõi nhiệm vụ được giao, cập nhật tiến độ và trạng thái thực hiện; các trao đổi liên quan được gắn với công việc để thuận tiện tra cứu.')
p('Các trạng thái cơ bản gồm chưa thực hiện, đang thực hiện và đã hoàn thành. Bộ lọc và thông tin thời hạn giúp người dùng xác định công việc cần ưu tiên. Dữ liệu tiến độ được sử dụng lại ở các màn hình tổng quan, qua đó hạn chế việc tổng hợp thủ công từ nhiều danh sách riêng lẻ.')
fig('Danh sách công việc cá nhân và cập nhật tiến độ')
fig('Biểu mẫu giao nhiệm vụ theo ban hoặc liên ban')

h('4.1.6. Quản lý sự kiện và điểm danh bằng mã QR', 2)
p('Giao diện quản lý sự kiện cho phép theo dõi tên chương trình, nội dung, thời gian, địa điểm, ngân sách, trạng thái và các liên kết tài nguyên. Sự kiện có thể được liên kết với nhiệm vụ, giao dịch thu chi và danh sách người đăng ký, giúp tập hợp thông tin phục vụ tổ chức chương trình.')
p('Công cụ điểm danh cho phép chọn sự kiện, bật camera và chuyển giữa chế độ check-in và check-out. Khi quét mã, hệ thống đối chiếu lượt đăng ký với sự kiện đã chọn và hiển thị kết quả xử lý. Danh sách người tham dự có các bộ lọc như chưa check-in, đang có mặt và đã check-out. Mã QR của lượt đăng ký được hỗ trợ gửi kèm email từ công cụ gửi thư; hệ thống có kiểm tra vé sai sự kiện và thao tác điểm danh lặp lại.')
fig('Danh sách và thông tin quản lý sự kiện')
fig('Quét mã QR check-in và check-out sự kiện')

h('4.1.7. Quản lý thu chi', 2)
p('Màn hình tài chính trình bày các giao dịch thu, chi và số liệu tổng hợp tương ứng. Người có quyền có thể thêm giao dịch, liên kết giao dịch với sự kiện và tra cứu theo các điều kiện trên giao diện. Việc liên kết thu chi với chương trình hỗ trợ đối chiếu ngân sách và tình hình sử dụng kinh phí. Phạm vi chức năng hiện tại tập trung vào ghi nhận và tổng hợp giao dịch, chưa bao gồm toàn bộ nghiệp vụ kế toán hoặc quy trình phê duyệt chứng từ nhiều cấp.')
fig('Quản lý giao dịch thu chi và tổng hợp tài chính')

h('4.1.8. Thông báo và công cụ hỗ trợ', 2)
p('Người dùng có thể xem thông báo qua biểu tượng thông báo và trang danh sách. Người được cấp quyền có thể tạo thông báo cho đối tượng phù hợp; việc giao nhiệm vụ cũng tạo thông tin nhắc nhận việc. Hệ thống đã có thành phần hỗ trợ Web Push, cho phép nhận thông báo trên trình duyệt khi máy chủ được cấu hình và người dùng cấp quyền.')
p('Các công cụ bổ trợ gồm gửi email hàng loạt, đồng hồ tranh biện và bốc thăm, chia đội. Công cụ email hỗ trợ mẫu nội dung, cá nhân hóa theo danh sách người nhận, xem trước và đính kèm mã QR khi gửi cho người đăng ký sự kiện. Đồng hồ hỗ trợ theo dõi thời lượng bài nói và tín hiệu âm thanh; công cụ chia đội phân phối danh sách ngẫu nhiên để hỗ trợ tổ chức hoạt động.')
fig('Danh sách thông báo và biểu mẫu tạo thông báo')
fig('Công cụ gửi email hàng loạt và xem trước nội dung')

h('4.1.9. Kho liên kết tài nguyên và quản trị nội dung', 2)
p('Màn hình link ấn phẩm lưu thông tin bài đăng, nền tảng, ban phụ trách và sự kiện liên quan. Thư viện tổng hợp liên kết ấn phẩm cùng tài nguyên được gắn với sự kiện, hỗ trợ tìm kiếm và truy cập từ một vị trí. Tài nguyên hiện được quản lý theo liên kết ngoài; giao diện thư viện chưa phải hệ thống tải lên và lưu trữ tệp độc lập.')
p('Giao diện CMS hỗ trợ chỉnh sửa các nội dung trên trang giới thiệu, quản lý dự án và thành tích, lưu bản nháp và xuất bản. Việc phân biệt nội dung đang chỉnh sửa với nội dung đã công bố tạo điều kiện kiểm tra thông tin trước khi hiển thị cho người truy cập.')
fig('Thư viện liên kết ấn phẩm và tài nguyên sự kiện')
fig('Quản trị nội dung trang giới thiệu bằng CMS')

h('4.1.10. Phân quyền và nhật ký hoạt động', 2)
p('Màn hình phân quyền thể hiện các nhóm chức năng được cấp cho từng ban. Ban Chủ nhiệm có quyền cập nhật ma trận phân quyền, còn khả năng truy cập của các vai trò khác được xác định theo cấu hình và quy tắc nghiệp vụ. Thanh điều hướng sử dụng thông tin quyền để hiển thị các chức năng tương ứng.')
p('Nhật ký hoạt động cung cấp thông tin về các thao tác được ghi nhận như tạo, sửa, xóa dữ liệu, thay đổi trạng thái, cập nhật tiến độ hoặc xuất bản nội dung. Người quản lý có thể tìm kiếm và lọc các bản ghi để hỗ trợ theo dõi quá trình sử dụng và tra cứu thay đổi. Phạm vi nhật ký phụ thuộc vào những nghiệp vụ đã được tích hợp cơ chế ghi nhận.')
fig('Ma trận phân quyền chức năng theo ban')
fig('Nhật ký hoạt động của hệ thống')

h('4.2. Kết quả đạt được')
lead('Về phạm vi chức năng,', 'hệ thống đã hình thành một nền tảng web gồm hai khu vực liên kết: giới thiệu câu lạc bộ và quản trị nội bộ. Khu vực công khai cung cấp thông tin về tổ chức, dự án, thành tích và thông báo; khu vực nội bộ tập hợp các chức năng quản lý nhân sự, nhiệm kỳ, công việc, sự kiện, thu chi, ấn phẩm, thông báo và phân quyền. Kết quả này tạo cơ sở để tổ chức dữ liệu hoạt động của câu lạc bộ theo một cấu trúc thống nhất.')
lead('Về xử lý nghiệp vụ,', 'các đối tượng dữ liệu đã có mối liên hệ phục vụ quy trình quản lý. Công việc có thể gắn với người nhận, ban và sự kiện; giao dịch thu chi và liên kết tài nguyên có thể gắn với chương trình; thành viên có thể được quản lý theo nhiệm kỳ. Thông tin từ các phân hệ được tổng hợp lại trên trang tổng quan và các màn hình biểu đồ, giúp người phụ trách theo dõi tiến độ từ dữ liệu nghiệp vụ đã nhập.')
lead('Về hỗ trợ tổ chức sự kiện,', 'hệ thống đã xây dựng các thành phần đăng ký tham gia bằng tài khoản Google, quản lý danh sách người đăng ký, gửi mã QR qua công cụ email và ghi nhận check-in, check-out. Các quy tắc kiểm tra sự kiện của vé, hạn chế thao tác điểm danh lặp và kiểm tra thứ tự check-in trước check-out đã được thể hiện trong phần xử lý. Đây là cơ sở kỹ thuật để giảm bước tra cứu thủ công khi đón tiếp, nhưng hiệu quả thực tế cần được đo trong buổi vận hành thử.')
lead('Về kiến trúc và lưu trữ,', 'ứng dụng được tổ chức theo mô hình giao diện Next.js và TypeScript, máy chủ Spring Boot và cơ sở dữ liệu PostgreSQL. Các thành phần trao đổi thông qua API; Flyway quản lý thay đổi cấu trúc dữ liệu theo phiên bản. Cấu hình Docker Compose mô tả các dịch vụ giao diện, máy chủ và cơ sở dữ liệu, hỗ trợ tái lập môi trường triển khai và giảm khác biệt trong quá trình cài đặt.')
lead('Về xác thực và kiểm soát truy cập,', 'hệ thống sử dụng Google OAuth kết hợp JWT cho phiên truy cập. Quyền sử dụng được tổ chức theo vai trò, ban và phân hệ; các thao tác quản trị có kiểm tra ở phía máy chủ. Cơ chế giới hạn phạm vi công việc theo người dùng và bộ lọc chức năng trên giao diện tạo nền tảng cho việc phân tách trách nhiệm giữa thành viên, trưởng ban và Ban Chủ nhiệm.')
lead('Về hỗ trợ bảo trì và kiểm thử,', 'dự án đã có các bài kiểm thử cho những nhóm xử lý như xác thực, phân quyền, thành viên, công việc, sự kiện, người tham dự, tài chính, nhiệm kỳ, thông báo và ấn phẩm. Phía giao diện có các kiểm thử cho một số hàm xử lý số liệu và tiện ích. Đây là tài sản phục vụ kiểm tra hồi quy khi thay đổi chức năng; mức độ sẵn sàng triển khai vẫn cần được xác nhận bằng kiểm thử tích hợp, kiểm thử toàn bộ luồng người dùng và vận hành thử với dữ liệu phù hợp.')

h('4.3. Đánh giá hệ thống')
p('Hệ thống được đánh giá theo khả năng đáp ứng nghiệp vụ, tổ chức giao diện, quản lý dữ liệu, kiểm soát truy cập và khả năng duy trì vận hành. Các chức năng hiện có cho thấy hệ thống đã bao quát nhiều hoạt động thường xuyên của câu lạc bộ. Tuy nhiên, việc có đầy đủ màn hình và thành phần xử lý chưa đủ để khẳng định hiệu năng, độ ổn định hoặc mức độ hài lòng khi sử dụng thực tế; các tiêu chí này cần được kiểm chứng qua thử nghiệm và khảo sát.')

h('4.3.1. Ưu điểm', 2)
lead('Tập trung dữ liệu và hỗ trợ phối hợp giữa các ban.', 'Thông tin thành viên, nhiệm vụ, sự kiện, tài chính và tài nguyên được truy cập trong cùng một hệ thống. Việc liên kết dữ liệu theo sự kiện và người phụ trách giúp giảm nhu cầu tìm kiếm trên nhiều kênh riêng lẻ, đồng thời tạo cơ sở thống nhất để theo dõi hoạt động và bàn giao công việc.')
lead('Chức năng bám sát hoạt động của câu lạc bộ.', 'Bên cạnh các nghiệp vụ quản lý chung, hệ thống có đồng hồ tranh biện, chia đội, gửi email và điểm danh QR. Các công cụ này hỗ trợ những tình huống cụ thể trong tổ chức sinh hoạt và sự kiện, giúp nền tảng có giá trị sử dụng vượt ra ngoài việc lưu danh sách nhân sự hoặc giới thiệu thông tin.')
lead('Giao diện phân nhóm theo công việc.', 'Các chức năng được sắp xếp thành nhóm như công việc, thông báo và truyền thông, tài chính và sự kiện, thành viên và hệ thống. Cách tổ chức này giúp người dùng tìm chức năng theo nhiệm vụ cần thực hiện. Các bảng dữ liệu, bộ lọc, thông báo lỗi và trạng thái tải được sử dụng để hỗ trợ thao tác và phản hồi kết quả xử lý.')
lead('Có cơ sở kiểm soát quyền và truy vết thay đổi.', 'Cơ chế phân quyền theo vai trò và phân hệ giúp giới hạn các thao tác quản trị. Nhật ký hoạt động ghi nhận nhiều thay đổi quan trọng, hỗ trợ đối chiếu dữ liệu và xác định thời điểm xử lý. Việc kiểm tra quyền phía máy chủ bổ sung cho cơ chế hiển thị chức năng trên giao diện.')
lead('Thuận lợi cho cập nhật nội dung và bảo trì.', 'CMS cho phép quản lý thông tin công khai bằng bản nháp và thao tác xuất bản. Việc tách giao diện, API và cơ sở dữ liệu giúp các phần của hệ thống có ranh giới tương đối rõ. Các migration và cấu hình đóng gói tạo cơ sở quản lý phiên bản, cài đặt lại môi trường và bổ sung chức năng trong tương lai.')

h('4.3.2. Hạn chế', 2)
lead('Một số nghiệp vụ mới dừng ở thiết kế dữ liệu.', 'Các nhu cầu như duyệt đề xuất, chốt và khóa nội dung sự kiện, quản lý hồ sơ đối tác và hợp đồng tài trợ, quản lý thiết bị mượn trả hoặc kho tệp thiết kế độc lập chưa được triển khai đầy đủ từ giao diện đến API. Vì vậy, hệ thống chưa thay thế toàn bộ công cụ và quy trình đang sử dụng trong câu lạc bộ.')
lead('Chưa đủ cơ sở định lượng về hiệu năng và độ tin cậy.', 'Cần bổ sung phép đo thời gian phản hồi, số người dùng đồng thời, tỷ lệ lỗi và tốc độ điểm danh khi nhiều thiết bị hoạt động cùng lúc. Những luồng liên quan đến Google, gửi email, Web Push và cơ sở dữ liệu thực cần được kiểm thử tích hợp trên môi trường triển khai. Các kết quả chức năng hiện tại chưa tương đương với bằng chứng vận hành ổn định ở quy mô lớn.')
lead('Khả năng mở rộng xử lý dữ liệu còn cần cải thiện.', 'Một số danh sách được tải về rồi lọc hoặc tổng hợp ở phía giao diện; danh sách sự kiện chưa có cơ chế phân trang phía máy chủ. Khi lượng dữ liệu tăng qua nhiều nhiệm kỳ, cách xử lý này có thể làm tăng dung lượng truyền tải và thời gian hiển thị. Nhật ký cũng đang được truy vấn theo giới hạn bản ghi, chưa đáp ứng đầy đủ nhu cầu lưu trữ và tra cứu lịch sử dài hạn.')
lead('Còn những điểm cần chuẩn hóa về dữ liệu và phiên truy cập.', 'Một số trạng thái công việc và mức ưu tiên đã khai báo ở phía ứng dụng chưa có biểu diễn tương ứng đầy đủ trong cơ sở dữ liệu. Cách trả dữ liệu giữa các nhóm API chưa hoàn toàn đồng nhất. Phiên đăng nhập đang được lưu ở phía trình duyệt, nên cần tiếp tục rà soát vòng đời token, biện pháp chống chèn mã và cơ chế thu hồi phiên trước khi mở rộng triển khai.')
lead('Luồng sự kiện và điểm danh còn giới hạn.', 'Đăng ký hiện gắn với sự kiện được chọn trong thông báo trên trang giới thiệu; chưa có danh mục sự kiện công khai và quy trình đăng ký riêng hoàn chỉnh. Chức năng đăng ký chưa có đầy đủ hạn mức chỗ và thời điểm đóng đăng ký. Danh sách điểm danh chưa tự đồng bộ tức thời giữa các thiết bị, đồng thời cần bổ sung theo dõi việc gửi vé và nhật ký quét để hỗ trợ đối soát.')
lead('Phụ thuộc vào dịch vụ ngoài và chất lượng cập nhật dữ liệu.', 'Google OAuth, Gmail và Web Push cần cấu hình hợp lệ, quyền truy cập và điều kiện kết nối phù hợp. Liên kết tài nguyên có thể mất hiệu lực khi tệp bên ngoài bị di chuyển hoặc thay đổi quyền chia sẻ. Các chỉ số hoàn thành công việc chỉ phản ánh dữ liệu đã được nhập; chúng chưa mô tả đầy đủ chất lượng sản phẩm, độ khó nhiệm vụ và đóng góp thực tế của từng thành viên.')

h('4.4. Hướng phát triển')
lead('Ưu tiên hoàn thiện chất lượng trước khi triển khai rộng.', 'Giai đoạn tiếp theo cần tổ chức kiểm thử toàn bộ các luồng quan trọng: đăng nhập, phân quyền, giao và nhận việc, cập nhật tiến độ, tạo sự kiện, đăng ký, gửi vé và điểm danh. Bổ sung kịch bản sai dữ liệu, hết hạn phiên, mất kết nối và nhiều thiết bị thao tác đồng thời. Đồng thời, thống nhất trạng thái giữa ứng dụng và cơ sở dữ liệu, chuẩn hóa phản hồi API và kiểm tra migration trên cơ sở dữ liệu thử nghiệm tách biệt.')
lead('Tăng cường khả năng vận hành và bảo vệ dữ liệu.', 'Xây dựng quy trình triển khai có kiểm tra tự động, tách cấu hình và dữ liệu mẫu khỏi môi trường sử dụng thực tế, thiết lập sao lưu và kiểm tra khôi phục. Bổ sung giám sát lỗi, thời gian phản hồi và tình trạng dịch vụ. Rà soát việc lưu trữ, làm mới và thu hồi token, đồng thời mở rộng nhật ký cho các thao tác phân quyền, gửi vé và điểm danh.')
lead('Tối ưu truy vấn và cập nhật thông tin.', 'Bổ sung phân trang, tìm kiếm và lọc phía máy chủ cho các danh sách lớn; tối ưu chỉ mục cơ sở dữ liệu theo những truy vấn thường dùng. Những báo cáo tổng hợp nhiều nguồn nên có API thống kê phù hợp để giảm lượng dữ liệu tải về. Với điểm danh và tiến độ công việc, có thể bổ sung cập nhật theo thời gian thực hoặc tải lại định kỳ có kiểm soát để phản ánh thay đổi từ các thiết bị khác.')
lead('Hoàn thiện quy trình sự kiện và thông báo.', 'Phát triển trang sự kiện công khai cùng biểu mẫu đăng ký riêng, hỗ trợ giới hạn số người và thời gian nhận đăng ký. Bổ sung trạng thái gửi vé, gửi lại mã QR, xuất danh sách tham dự và thống kê sau sự kiện. Với thông báo, mở rộng sang nhắc việc đến hạn theo lịch và tùy chọn nhận tin của người dùng, đồng thời theo dõi kết quả gửi để hạn chế bỏ sót thông tin.')
lead('Mở rộng nghiệp vụ theo nhu cầu thực tế.', 'Ưu tiên xây dựng quy trình duyệt đề xuất và chốt nội dung, quản lý thiết bị mượn trả, hồ sơ đối tác và tài trợ khi được xác nhận là cần thiết. Thư viện có thể bổ sung lưu trữ tệp, phân loại và quản lý phiên bản nếu việc quản lý bằng liên kết không còn đáp ứng nhu cầu. Các tích hợp với công cụ làm việc sẵn có nên hướng đến giảm nhập liệu lặp và thuận tiện bàn giao giữa các nhiệm kỳ.')
lead('Đánh giá trải nghiệm và hoàn thiện báo cáo quản trị.', 'Tổ chức sử dụng thử với thành viên, trưởng ban và Ban Chủ nhiệm; ghi nhận thời gian hoàn thành thao tác, lỗi thường gặp và phản hồi về giao diện trên máy tính, điện thoại. Từ kết quả đó, điều chỉnh biểu mẫu và điều hướng, cải thiện khả năng tiếp cận. Các báo cáo đóng góp nên kết hợp tiến độ với chất lượng và mức độ khó của nhiệm vụ, tránh sử dụng số lượng công việc như tiêu chí đánh giá duy nhất.')
p('Các hướng phát triển trên được triển khai theo thứ tự ưu tiên từ độ tin cậy, khả năng vận hành đến mở rộng nghiệp vụ. Cách tiếp cận này giúp hệ thống từng bước đáp ứng nhu cầu sử dụng thực tế của NEU Debate Club, đồng thời duy trì khả năng bảo trì và chuyển giao cho những thế hệ thành viên tiếp theo.')

footer = sec.footer.paragraphs[0]
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
footer.paragraph_format.first_line_indent = Cm(0)
r = footer.add_run()
r.font.name, r.font.size = 'Times New Roman', Pt(11)
fld = OxmlElement('w:fldSimple')
fld.set(qn('w:instr'), 'PAGE')
r._r.addnext(fld)
doc.core_properties.title = 'Chương 4 Kết quả đạt được và đánh giá hệ thống NEU Debate Club'
doc.core_properties.subject = 'Báo cáo hệ thống quản lý câu lạc bộ NEU Debate Club'
doc.core_properties.author = ''
doc.core_properties.keywords = 'NEU Debate Club, kết quả, đánh giá, hướng phát triển'
doc.save(OUT)
assert len(figures) == 17
assert all(s in '\n'.join(x.text for x in doc.paragraphs) for s in ['4.1. Giao diện ứng dụng', '4.2. Kết quả đạt được', '4.3. Đánh giá hệ thống', '4.3.1. Ưu điểm', '4.3.2. Hạn chế', '4.4. Hướng phát triển'])
print(str(OUT))
print('Paragraphs:', len(doc.paragraphs), 'Figures:', len(figures), 'Words:', sum(len(x.text.split()) for x in doc.paragraphs))
