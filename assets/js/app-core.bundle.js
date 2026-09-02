/* ===== assets/js/core.js ===== */
const APP_VERSION='39.2'; // Avatar 3D Visual Upgrade on  platform.
const chapters=[
{id:1,title:'Ứng dụng đạo hàm để khảo sát hàm số',desc:'Đơn điệu, cực trị, GTLN–GTNN, tiệm cận, khảo sát đồ thị và bài toán thực tế.',lessons:[
 {id:'F1-01',common:'Sự đồng biến và nghịch biến của hàm số'},
 {id:'F1-02',common:'Cực trị của hàm số'},
 {id:'F1-03',common:'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'},
 {id:'F1-04',common:'Đường tiệm cận'},
 {id:'F1-05',common:'Khảo sát sự biến thiên và vẽ đồ thị hàm số'}]},
{id:2,title:'Vectơ và hệ tọa độ trong không gian',desc:'Vectơ Oxyz, tọa độ điểm – vectơ, tích vô hướng và các phép toán tọa độ.',lessons:[
 {id:'F2-01',common:'Vectơ và các phép toán trong không gian'},
 {id:'F2-02',common:'Hệ tọa độ và tọa độ vectơ trong không gian'},
 {id:'F2-03',common:'Biểu thức tọa độ của các phép toán vectơ'}]},
{id:3,title:'Độ phân tán của mẫu số liệu ghép nhóm',desc:'Khoảng biến thiên, khoảng tứ phân vị, phương sai và độ lệch chuẩn.',lessons:[
 {id:'F3-01',common:'Khoảng biến thiên và khoảng tứ phân vị'},
 {id:'F3-02',common:'Phương sai và độ lệch chuẩn'}]},
{id:4,title:'Nguyên hàm và tích phân',desc:'Nguyên hàm, tích phân xác định và ứng dụng hình học của tích phân.',lessons:[
 {id:'F4-01',common:'Nguyên hàm và nguyên hàm của hàm số sơ cấp'},
 {id:'F4-02',common:'Tích phân'},
 {id:'F4-03',common:'Ứng dụng hình học của tích phân'}]},
{id:5,title:'Phương pháp tọa độ trong không gian',desc:'Mặt phẳng, đường thẳng, góc – khoảng cách và mặt cầu trong Oxyz.',lessons:[
 {id:'F5-01',common:'Phương trình mặt phẳng'},
 {id:'F5-02',common:'Phương trình đường thẳng trong không gian'},
 {id:'F5-03',common:'Góc và khoảng cách trong không gian'},
 {id:'F5-04',common:'Phương trình mặt cầu'}]},
{id:6,title:'Xác suất có điều kiện',desc:'Xác suất có điều kiện, công thức xác suất toàn phần và công thức Bayes.',lessons:[
 {id:'F6-01',common:'Xác suất có điều kiện'},
 {id:'F6-02',common:'Công thức xác suất toàn phần và Bayes'}]}
];
const TOTAL=chapters.reduce((s,c)=>s+c.lessons.length,0);
const lessonCurriculum={
 'F1-01':{minutes:50,goals:['Xét tính đồng biến, nghịch biến bằng đạo hàm.','Đọc tính đơn điệu từ bảng biến thiên và đồ thị.','Giải bài toán tham số, ứng dụng tính đơn điệu.'],knowledge:[{code:'F1-01.K1',title:'Dấu đạo hàm và chiều biến thiên',level:'NB',summary:'Dùng dấu của đạo hàm để kết luận đồng biến, nghịch biến trên từng khoảng.'},{code:'F1-01.K2',title:'Đọc tính đơn điệu từ BBT và đồ thị',level:'TH',summary:'Đọc chiều biến thiên đúng theo tập xác định và các khoảng bị ngắt.'},{code:'F1-01.K3',title:'Tham số và ứng dụng tính đơn điệu',level:'VD',summary:'Chuyển yêu cầu đơn điệu thành điều kiện dấu của đạo hàm trên toàn miền.'}],forms:[],example:{problem:'',solution:''},mistakes:[]},
 'F1-02':{minutes:50,goals:['Phân biệt điểm cực trị và giá trị cực trị.','Tìm cực trị từ công thức, BBT hoặc đồ thị.','Giải bài toán tham số về cực trị.'],knowledge:[{code:'F1-02.K1',title:'Điều kiện để có cực trị',level:'NB',summary:'Nhận biết cực trị qua sự đổi chiều biến thiên hoặc đổi dấu đạo hàm.'},{code:'F1-02.K2',title:'Cực trị từ BBT và đồ thị',level:'TH',summary:'Đọc đúng hoành độ và giá trị cực đại, cực tiểu.'},{code:'F1-02.K3',title:'Bài toán tham số về cực trị',level:'VD',summary:'Quy điều kiện cực trị về nghiệm và sự đổi dấu của đạo hàm.'}],forms:[],example:{problem:'',solution:''},mistakes:[]},
 'F1-03':{minutes:50,goals:['Tìm GTLN, GTNN trên đoạn.','Xét GTLN, GTNN trên khoảng hoặc miền.','Giải bài toán tối ưu thực tế.'],knowledge:[{code:'F1-03.K1',title:'GTLN, GTNN trên đoạn',level:'NB',summary:'So sánh giá trị tại đầu mút và các điểm tới hạn thuộc đoạn.'},{code:'F1-03.K2',title:'GTLN, GTNN trên khoảng và miền',level:'TH',summary:'Dùng BBT và giới hạn để kiểm tra giá trị có thực sự đạt được.'},{code:'F1-03.K3',title:'Tối ưu và ứng dụng GTLN–GTNN',level:'VD',summary:'Mô hình hóa, xác định miền và tối ưu hàm mục tiêu.'}],forms:[],example:{problem:'',solution:''},mistakes:[]},
 'F1-04':{minutes:45,goals:['Xác định tiệm cận đứng.','Xác định tiệm cận ngang, xiên.','Giải bài toán tham số và quan hệ đồ thị–tiệm cận.'],knowledge:[{code:'F1-04.K1',title:'Tiệm cận đứng',level:'NB',summary:'Xét giới hạn một phía tại điểm nghi ngờ tiệm cận đứng.'},{code:'F1-04.K2',title:'Tiệm cận ngang và tiệm cận xiên',level:'TH',summary:'Dùng giới hạn ở vô cực để xác định tiệm cận ngang hoặc xiên.'},{code:'F1-04.K3',title:'Tham số và quan hệ đồ thị – tiệm cận',level:'VD',summary:'Kết hợp điều kiện tiệm cận, tâm đối xứng và dữ kiện đồ thị.'}],forms:[],example:{problem:'',solution:''},mistakes:[]},
 'F1-05':{minutes:60,goals:['Khảo sát và nhận dạng đồ thị.','Giải bài toán tương giao, tiếp tuyến, điểm đặc biệt.','Khai thác đồ thị đạo hàm và câu tổng hợp.'],knowledge:[{code:'F1-05.K1',title:'Quy trình khảo sát và nhận dạng đồ thị',level:'NB',summary:'Kết hợp tập xác định, đạo hàm, cực trị, tiệm cận và giao trục.'},{code:'F1-05.K2',title:'Tương giao, tiếp tuyến và điểm đặc biệt',level:'TH',summary:'Khai thác giao điểm, tiếp tuyến, tâm đối xứng và các điểm đặc biệt.'},{code:'F1-05.K3',title:'Đồ thị đạo hàm và bài toán tổng hợp',level:'VD',summary:'Khai thác đồ thị đạo hàm và phối hợp nhiều kiến thức của chương.'}],forms:[],example:{problem:'',solution:''},mistakes:[]},
 'F2-01':{minutes:45,goals:['Thực hiện được phép cộng, trừ và nhân vectơ với số trong không gian.','Hiểu các quan hệ cùng phương, đồng phẳng cơ bản.','Vận dụng vectơ để biểu diễn quan hệ hình học.'],knowledge:[{code:'F2-01.K1',title:'Phép toán vectơ',level:'NB',summary:'Các quy tắc cộng, trừ, nhân vectơ với số giữ nguyên như trong mặt phẳng.'},{code:'F2-01.K2',title:'Cùng phương và phân tích vectơ',level:'TH',summary:'Hai vectơ cùng phương khi vectơ này là một bội của vectơ kia.'},{code:'F2-01.K3',title:'Ứng dụng trong hình học không gian',level:'VD',summary:'Dùng vectơ để biểu diễn trung điểm, trọng tâm và quan hệ song song.'}],forms:[{title:'Tính tổng – hiệu vectơ',level:'NB',tip:'Dùng quy tắc ba điểm và hình bình hành.'},{title:'Chứng minh cùng phương',level:'TH',tip:'Tìm hệ số k sao cho a=k b.'},{title:'Biểu diễn vectơ theo vectơ cơ sở',level:'VD',tip:'Chọn đường đi thuận lợi giữa hai điểm.'}],example:{problem:'Cho hình hộp ABCD.A\'B\'C\'D\'. Biểu diễn AC\' theo AB, AD, AA\'.',solution:'Theo quy tắc hình hộp: AC\'=AB+AD+AA\'.'},mistakes:['Nhầm hướng của vectơ khi đổi thứ tự hai điểm.','Cộng các độ dài thay vì cộng vectơ.']},
 'F2-02':{minutes:45,goals:['Xác định được tọa độ điểm và vectơ trong Oxyz.','Tính tọa độ trung điểm, trọng tâm và độ dài đoạn thẳng.','Chuyển đổi linh hoạt giữa hình học và tọa độ.'],knowledge:[{code:'F2-02.K1',title:'Tọa độ điểm và vectơ',level:'NB',summary:'Nếu A(x_A,y_A,z_A), B(x_B,y_B,z_B) thì AB=(x_B-x_A,y_B-y_A,z_B-z_A).'},{code:'F2-02.K2',title:'Khoảng cách và trung điểm',level:'TH',summary:'AB là căn tổng bình phương các hiệu tọa độ; trung điểm lấy trung bình từng tọa độ.'},{code:'F2-02.K3',title:'Tọa độ điểm đặc biệt',level:'VD',summary:'Dùng quan hệ vectơ để tìm tọa độ trọng tâm, điểm chia đoạn hoặc điểm đối xứng.'}],forms:[{title:'Tính tọa độ vectơ',level:'NB',tip:'Điểm cuối trừ điểm đầu.'},{title:'Tính khoảng cách, trung điểm',level:'TH',tip:'Thực hiện theo từng tọa độ.'},{title:'Tìm tọa độ điểm theo điều kiện vectơ',level:'VD',tip:'Biến điều kiện hình học thành phương trình tọa độ.'}],example:{problem:'Cho A(1,2,3), B(3,0,5). Tính AB và trung điểm M của AB.',solution:'AB=(2,-2,2), nên |AB|=2√3. Trung điểm M(2,1,4).'},mistakes:['Lấy điểm đầu trừ điểm cuối khi tính AB.','Bỏ quên tọa độ z.']},
 'F2-03':{minutes:50,goals:['Tính được tích vô hướng bằng tọa độ.','Tính độ dài và góc giữa hai vectơ.','Vận dụng điều kiện vuông góc, cùng phương bằng tọa độ.'],knowledge:[{code:'F2-03.K1',title:'Biểu thức tọa độ phép toán vectơ',level:'NB',summary:'Cộng, trừ và nhân với số được thực hiện theo từng tọa độ.'},{code:'F2-03.K2',title:'Tích vô hướng và góc',level:'TH',summary:'a·b=x_ax_b+y_ay_b+z_az_b và cos góc=(a·b)/(|a||b|).'},{code:'F2-03.K3',title:'Điều kiện hình học bằng tọa độ',level:'VD',summary:'Vuông góc ↔ tích vô hướng bằng 0; cùng phương ↔ tọa độ tỉ lệ.'}],forms:[{title:'Tính tích vô hướng',level:'NB',tip:'Nhân tọa độ tương ứng rồi cộng.'},{title:'Tính góc giữa hai vectơ',level:'TH',tip:'Luôn kiểm tra mẫu |a||b| khác 0.'},{title:'Tìm tham số để vuông góc/cùng phương',level:'VD',tip:'Lập phương trình từ tích vô hướng hoặc tỉ lệ.'}],example:{problem:'Cho a=(1,0,2), b=(2,1,-1). Tính a·b và kết luận quan hệ góc.',solution:'a·b=1·2+0·1+2·(-1)=0, vì vậy a vuông góc b.'},mistakes:['Nhầm tích vô hướng với tích từng tọa độ tạo thành vectơ.','Quên điều kiện vectơ khác 0 khi nói về góc.']},
 'F3-01':{minutes:45,goals:['Tính được khoảng biến thiên của mẫu ghép nhóm.','Hiểu và tính gần đúng các tứ phân vị của mẫu ghép nhóm.','Giải thích được ý nghĩa của khoảng tứ phân vị trong so sánh độ phân tán.'],knowledge:[{code:'F3-01.K1',title:'Khoảng biến thiên',level:'NB',summary:'Khoảng biến thiên phản ánh độ trải rộng toàn bộ, bằng giá trị lớn nhất trừ nhỏ nhất (hoặc xấp xỉ theo biên lớp).'},{code:'F3-01.K2',title:'Tứ phân vị của số liệu ghép nhóm',level:'TH',summary:'Xác định lớp chứa Q1, Q2, Q3 bằng tần số tích lũy rồi nội suy.'},{code:'F3-01.K3',title:'Khoảng tứ phân vị',level:'VD',summary:'ΔQ=Q3-Q1, ít nhạy với giá trị ngoại lệ hơn khoảng biến thiên.'}],forms:[{title:'Tính khoảng biến thiên',level:'NB',tip:'Với ghép nhóm thường dùng cận trên cuối và cận dưới đầu.'},{title:'Xác định lớp chứa tứ phân vị',level:'TH',tip:'Dùng các vị trí n/4, n/2, 3n/4.'},{title:'So sánh mức độ phân tán',level:'VD',tip:'Chọn chỉ số phù hợp và giải thích ý nghĩa.'}],example:{problem:'Một mẫu có giá trị nhỏ nhất 12 và lớn nhất 38. Tính khoảng biến thiên.',solution:'R=38-12=26.'},mistakes:['Nhầm khoảng tứ phân vị với khoảng biến thiên.','Dùng sai tần số tích lũy khi xác định lớp chứa Q1, Q3.']},
 'F3-02':{minutes:50,goals:['Tính được phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm.','Giải thích được ý nghĩa độ lệch chuẩn.','So sánh độ phân tán của các mẫu trong tình huống đơn giản.'],knowledge:[{code:'F3-02.K1',title:'Giá trị đại diện của lớp',level:'NB',summary:'Thường lấy trung điểm của mỗi khoảng làm giá trị đại diện khi tính các đặc trưng.'},{code:'F3-02.K2',title:'Phương sai',level:'TH',summary:'Phương sai là trung bình có trọng số của bình phương độ lệch so với số trung bình.'},{code:'F3-02.K3',title:'Độ lệch chuẩn',level:'VD',summary:'Độ lệch chuẩn là căn bậc hai của phương sai và có cùng đơn vị với dữ liệu.'}],forms:[{title:'Tính phương sai từ bảng ghép nhóm',level:'TH',tip:'Lập cột giá trị đại diện, tần số và bình phương.'},{title:'Tính độ lệch chuẩn',level:'NB',tip:'Lấy căn bậc hai của phương sai.'},{title:'So sánh độ ổn định',level:'VD',tip:'Độ lệch chuẩn nhỏ hơn thường cho dữ liệu tập trung hơn.'}],example:{problem:'Nếu phương sai của một mẫu bằng 16 thì độ lệch chuẩn bằng bao nhiêu?',solution:'s=√16=4.'},mistakes:['Quên căn bậc hai khi chuyển từ phương sai sang độ lệch chuẩn.','Dùng tần suất/tần số không nhất quán trong công thức.']},
 'F4-01':{minutes:50,goals:['Hiểu khái niệm nguyên hàm và họ nguyên hàm.','Tìm nguyên hàm của các hàm số sơ cấp và dùng tính chất tuyến tính.','Vận dụng đổi biến đơn giản trong một số trường hợp.'],knowledge:[{code:'F4-01.K1',title:'Khái niệm nguyên hàm',level:'NB',summary:'F là nguyên hàm của f trên khoảng nếu F\'=f; họ nguyên hàm là F(x)+C.'},{code:'F4-01.K2',title:'Bảng nguyên hàm cơ bản',level:'TH',summary:'Ghi nhớ nguyên hàm của lũy thừa, lượng giác, mũ và 1/x.'},{code:'F4-01.K3',title:'Biến đổi để tìm nguyên hàm',level:'VD',summary:'Tách, đặt nhân tử và nhận dạng đạo hàm của hàm hợp.'}],forms:[{title:'Nguyên hàm trực tiếp',level:'NB',tip:'Đối chiếu bảng nguyên hàm.'},{title:'Dùng tính tuyến tính',level:'TH',tip:'Tách tổng và đưa hằng số ra ngoài dấu tích phân.'},{title:'Nhận dạng hàm hợp',level:'VD',tip:'Tìm biểu thức có đạo hàm xuất hiện kèm theo.'}],example:{problem:'Tìm ∫3x^2 dx.',solution:'Vì (x^3)\'=3x^2 nên ∫3x^2 dx=x^3+C.'},mistakes:['Quên hằng số C.','Dùng công thức ∫x^n dx cho n=-1.']},
 'F4-02':{minutes:50,goals:['Hiểu tích phân xác định và công thức Newton–Leibniz.','Tính được tích phân bằng nguyên hàm và các tính chất.','Vận dụng đổi biến đơn giản trong tính tích phân.'],knowledge:[{code:'F4-02.K1',title:'Tích phân xác định',level:'NB',summary:'Tích phân ∫_a^b f(x)dx là một số, không kèm hằng số C.'},{code:'F4-02.K2',title:'Newton–Leibniz',level:'TH',summary:'Nếu F\'=f thì ∫_a^b f(x)dx=F(b)-F(a).'},{code:'F4-02.K3',title:'Tính chất và biến đổi tích phân',level:'VD',summary:'Dùng tuyến tính, đổi cận và nhận dạng để rút gọn phép tính.'}],forms:[{title:'Tính tích phân trực tiếp',level:'NB',tip:'Tìm nguyên hàm rồi thế cận trên trừ cận dưới.'},{title:'Dùng tính chất tích phân',level:'TH',tip:'Tách khoảng hoặc kết hợp các tích phân cùng cận.'},{title:'Đổi biến đơn giản',level:'VD',tip:'Đổi cả biểu thức vi phân và cận.'}],example:{problem:'Tính ∫_0^1 2x dx.',solution:'Một nguyên hàm là x^2, do đó [x^2]_0^1=1.'},mistakes:['Thêm +C vào tích phân xác định.','Thế cận theo thứ tự F(a)-F(b).']},
 'F4-03':{minutes:55,goals:['Thiết lập được công thức diện tích hình phẳng bằng tích phân.','Tính được thể tích một số vật thể/tròn xoay quen thuộc.','Giải được bài toán ứng dụng tích phân trong hình học.'],knowledge:[{code:'F4-03.K1',title:'Diện tích giới hạn bởi đồ thị và trục Ox',level:'NB',summary:'S=∫|f(x)|dx trên khoảng cần xét.'},{code:'F4-03.K2',title:'Diện tích giữa hai đồ thị',level:'TH',summary:'S=∫|f(x)-g(x)|dx, cần tìm giao điểm và xét vị trí tương đối.'},{code:'F4-03.K3',title:'Thể tích bằng tích phân',level:'VD',summary:'Thiết lập tích phân từ diện tích thiết diện hoặc công thức khối tròn xoay.'}],forms:[{title:'Diện tích dưới đồ thị',level:'NB',tip:'Kiểm tra dấu của f(x).'},{title:'Diện tích giữa hai đường',level:'TH',tip:'Giải phương trình giao điểm trước.'},{title:'Thể tích vật thể/tròn xoay',level:'VD',tip:'Vẽ phác miền để chọn đúng bán kính/thiết diện.'}],example:{problem:'Tính diện tích giới hạn bởi y=x, Ox, x=0 và x=2.',solution:'Trên [0,2], x≥0 nên S=∫_0^2 x dx=[x^2/2]_0^2=2.'},mistakes:['Quên giá trị tuyệt đối khi hàm đổi dấu.','Lấy sai hàm trên trừ hàm dưới.']},
 'F5-01':{minutes:50,goals:['Viết được phương trình mặt phẳng khi biết điểm và vectơ pháp tuyến.','Xác định được vectơ pháp tuyến từ phương trình mặt phẳng.','Giải được bài toán song song, vuông góc liên quan đến mặt phẳng.'],knowledge:[{code:'F5-01.K1',title:'Vectơ pháp tuyến',level:'NB',summary:'Với (P):ax+by+cz+d=0 thì n=(a,b,c) là một vectơ pháp tuyến.'},{code:'F5-01.K2',title:'Phương trình mặt phẳng qua điểm',level:'TH',summary:'Qua M(x0,y0,z0), VTPT n=(a,b,c): a(x-x0)+b(y-y0)+c(z-z0)=0.'},{code:'F5-01.K3',title:'Quan hệ giữa các mặt phẳng',level:'VD',summary:'So sánh vectơ pháp tuyến để xét song song hoặc vuông góc.'}],forms:[{title:'Viết mặt phẳng qua điểm, biết VTPT',level:'NB',tip:'Thế điểm vào dạng điểm-pháp tuyến.'},{title:'Tìm VTPT từ dữ kiện hình học',level:'TH',tip:'Dùng tích có hướng nếu cần (ở mức mở rộng) hoặc quan hệ vuông góc.'},{title:'Mặt phẳng theo tham số',level:'VD',tip:'Chuyển điều kiện song song/vuông góc về vectơ pháp tuyến.'}],example:{problem:'Viết mặt phẳng qua M(1,0,0), có VTPT n=(1,2,-1).',solution:'(x-1)+2y-z=0, hay x+2y-z-1=0.'},mistakes:['Dùng vectơ chỉ phương thay cho vectơ pháp tuyến.','Sai dấu khi khai triển phương trình qua điểm.']},
 'F5-02':{minutes:50,goals:['Viết được phương trình tham số của đường thẳng.','Xác định điểm đi qua và vectơ chỉ phương từ phương trình.','Xét được vị trí tương đối của hai đường thẳng hoặc đường thẳng với mặt phẳng trong trường hợp cơ bản.'],knowledge:[{code:'F5-02.K1',title:'Vectơ chỉ phương',level:'NB',summary:'Đường thẳng có phương trình tham số r=r0+t u với u là vectơ chỉ phương khác 0.'},{code:'F5-02.K2',title:'Phương trình tham số',level:'TH',summary:'x=x0+at, y=y0+bt, z=z0+ct.'},{code:'F5-02.K3',title:'Vị trí tương đối',level:'VD',summary:'Dùng quan hệ của vectơ chỉ phương và nghiệm hệ phương trình để xét cắt, song song, chéo nhau.'}],forms:[{title:'Viết đường thẳng qua điểm, biết VTCP',level:'NB',tip:'Thay trực tiếp vào dạng tham số.'},{title:'Đường thẳng qua hai điểm',level:'TH',tip:'Lấy AB làm vectơ chỉ phương.'},{title:'Xét vị trí tương đối',level:'VD',tip:'Tách bài toán hướng và bài toán giao điểm.'}],example:{problem:'Viết đường thẳng qua A(1,2,0), có VTCP u=(2,-1,3).',solution:'x=1+2t, y=2-t, z=3t với t∈R.'},mistakes:['Nhầm VTCP với VTPT.','Cho vectơ chỉ phương bằng vectơ không.']},
 'F5-03':{minutes:55,goals:['Tính được góc giữa các đối tượng bằng vectơ.','Tính được khoảng cách từ điểm đến mặt phẳng.','Vận dụng công thức góc – khoảng cách vào bài toán tọa độ.'],knowledge:[{code:'F5-03.K1',title:'Góc giữa vectơ/đường thẳng/mặt phẳng',level:'TH',summary:'Quy về góc giữa các vectơ chỉ phương hoặc pháp tuyến và dùng tích vô hướng.'},{code:'F5-03.K2',title:'Khoảng cách điểm – mặt phẳng',level:'NB',summary:'d(M,(P))=|ax0+by0+cz0+d|/√(a²+b²+c²).'},{code:'F5-03.K3',title:'Bài toán tổng hợp góc – khoảng cách',level:'VD',summary:'Chọn vectơ phù hợp và kết hợp phương trình đối tượng.'}],forms:[{title:'Khoảng cách điểm đến mặt phẳng',level:'NB',tip:'Thế tọa độ điểm vào tử số rồi lấy giá trị tuyệt đối.'},{title:'Góc giữa hai đường/hai mặt phẳng',level:'TH',tip:'Quy về góc giữa VTCP hoặc VTPT.'},{title:'Góc đường thẳng – mặt phẳng',level:'VD',tip:'Chú ý quan hệ bù giữa góc với pháp tuyến.'}],example:{problem:'Tính khoảng cách từ O đến (P):2x-y+2z-3=0.',solution:'d=|-3|/√(4+1+4)=3/3=1.'},mistakes:['Quên giá trị tuyệt đối ở tử công thức khoảng cách.','Nhầm công thức góc đường thẳng–mặt phẳng với góc giữa VTCP và VTPT.']},
 'F5-04':{minutes:45,goals:['Nhận biết tâm và bán kính từ phương trình mặt cầu.','Viết được phương trình mặt cầu khi biết tâm và bán kính.','Giải được bài toán mặt cầu qua điểm hoặc tiếp xúc trong trường hợp cơ bản.'],knowledge:[{code:'F5-04.K1',title:'Phương trình chuẩn của mặt cầu',level:'NB',summary:'(x-a)^2+(y-b)^2+(z-c)^2=R^2 có tâm I(a,b,c), bán kính R.'},{code:'F5-04.K2',title:'Dạng khai triển',level:'TH',summary:'Hoàn thành bình phương để đưa phương trình tổng quát về dạng chuẩn.'},{code:'F5-04.K3',title:'Điều kiện đi qua/tiếp xúc',level:'VD',summary:'Đi qua M khi IM=R; tiếp xúc mặt phẳng khi khoảng cách từ tâm đến mặt phẳng bằng R.'}],forms:[{title:'Đọc tâm, bán kính',level:'NB',tip:'Để ý dấu ngược trong (x-a)^2.'},{title:'Viết mặt cầu biết tâm, bán kính',level:'TH',tip:'Thế trực tiếp vào dạng chuẩn.'},{title:'Mặt cầu tiếp xúc mặt phẳng',level:'VD',tip:'Dùng d(I,(P))=R.'}],example:{problem:'Viết mặt cầu tâm I(1,2,-1), bán kính 3.',solution:'(x-1)^2+(y-2)^2+(z+1)^2=9.'},mistakes:['Đọc sai dấu tọa độ tâm.','Nhầm R với R^2 ở vế phải.']},
 'F6-01':{minutes:50,goals:['Nhận biết được xác suất có điều kiện.','Tính được P(A|B) từ xác suất giao và xác suất điều kiện.','Giải thích được ý nghĩa của xác suất có điều kiện trong bối cảnh thực tế.'],knowledge:[{code:'F6-01.K1',title:'Khái niệm xác suất có điều kiện',level:'NB',summary:'P(A|B) là xác suất A xảy ra khi biết B đã xảy ra.'},{code:'F6-01.K2',title:'Công thức xác suất có điều kiện',level:'TH',summary:'P(A|B)=P(A∩B)/P(B), với P(B)>0.'},{code:'F6-01.K3',title:'Quy tắc nhân xác suất',level:'VD',summary:'P(A∩B)=P(B)P(A|B)=P(A)P(B|A).'}],forms:[{title:'Tính trực tiếp P(A|B)',level:'NB',tip:'Xác định đúng biến cố điều kiện ở mẫu.'},{title:'Tính xác suất giao',level:'TH',tip:'Dùng quy tắc nhân.'},{title:'Bài toán bảng 2×2/cây xác suất',level:'VD',tip:'Khoanh đúng không gian mẫu sau khi có điều kiện.'}],example:{problem:'Biết P(A∩B)=0,2 và P(B)=0,5. Tính P(A|B).',solution:'P(A|B)=0,2/0,5=0,4.'},mistakes:['Đảo P(A|B) thành P(B|A).','Quên điều kiện P(B)>0.']},
 'F6-02':{minutes:55,goals:['Mô tả được công thức xác suất toàn phần.','Sử dụng được công thức Bayes.','Vận dụng sơ đồ cây/bảng dữ liệu vào bài toán thực tiễn đơn giản.'],knowledge:[{code:'F6-02.K1',title:'Phân hoạch và xác suất toàn phần',level:'TH',summary:'Nếu B_i tạo thành phân hoạch thì P(A)=ΣP(B_i)P(A|B_i).'},{code:'F6-02.K2',title:'Công thức Bayes',level:'TH',summary:'Bayes cho phép đảo chiều xác suất có điều kiện từ nguyên nhân sang kết quả.'},{code:'F6-02.K3',title:'Mô hình cây xác suất',level:'VD',summary:'Nhân theo nhánh, cộng các nhánh thích hợp rồi dùng Bayes nếu cần.'}],forms:[{title:'Xác suất toàn phần',level:'TH',tip:'Chia theo các trường hợp loại trừ nhau và phủ toàn bộ.'},{title:'Bayes hai nhóm',level:'TH',tip:'Tính mẫu P(A) bằng toàn phần trước.'},{title:'Bài toán thực tế nhiều nhánh',level:'VD',tip:'Vẽ cây để tránh bỏ sót hoặc cộng sai nhánh.'}],example:{problem:'Một sản phẩm đến từ máy M1 với xác suất 0,6 và M2 với xác suất 0,4. Tỉ lệ lỗi lần lượt 0,02 và 0,05. Tính xác suất sản phẩm lỗi.',solution:'Theo công thức toàn phần: P(L)=0,6·0,02+0,4·0,05=0,032.'},mistakes:['Dùng Bayes khi chưa tính xác suất toàn phần ở mẫu.','Cộng xác suất trên cùng một nhánh thay vì nhân.']}
};

function getLesson(id){return chapters.flatMap(c=>c.lessons.map(l=>({...l,chapter:c}))).find(l=>l.id===id)}
function getLessonMeta(id){return lessonCurriculum[id]||{minutes:45,goals:[],knowledge:[],forms:[],example:{problem:'',solution:''},mistakes:[]}}
function levelName(v){return v==='NB'?'Nhận biết':v==='TH'?'Thông hiểu':v==='VDC'?'Vận dụng cao':'Vận dụng'}
function levelClass(v){return v==='NB'?'nb':v==='TH'?'th':v==='VDC'?'vdc':'vd'}
function displayKnowledgeCode(code=''){return window.v3821Taxonomy?.humanCode?.(code,true)||String(code||'')}
function displayLessonLabel(id=''){const c=String(id||''),t=window.v3821Taxonomy?.lessons?.[c];if(t)return `Bài ${t.n} • ${t.title} • ${t.stem}`;const l=typeof getLesson==='function'?getLesson(c):null;return l?`${l.common} • ${c}`:c}

const LOCAL_STATE_KEY='math12hub2026';
const V21_DEVICE_KEY='math12hub2026_device_v21';
function v21DeviceId(){let id='';try{id=localStorage.getItem(V21_DEVICE_KEY)||'';if(!id){id='DEV-'+Date.now().toString(36).toUpperCase()+'-'+Math.random().toString(36).slice(2,8).toUpperCase();localStorage.setItem(V21_DEVICE_KEY,id)}}catch(_){id='DEV-SESSION'}return id}
let state,localStateLoadError='';
try{state=JSON.parse(localStorage.getItem(LOCAL_STATE_KEY)||'null')}catch(err){localStateLoadError=String(err?.message||err);state=null}
state=state||{done:[],attempts:[],role:'student'};
state.done=Array.isArray(state.done)?state.done:[];state.attempts=Array.isArray(state.attempts)?state.attempts:[];state.examAttempts=Array.isArray(state.examAttempts)?state.examAttempts:[];state.mastered=state.mastered||{};state.lessonScores=state.lessonScores||{};state.questionBank=Array.isArray(state.questionBank)?state.questionBank:null;state.questionHistory=Array.isArray(state.questionHistory)?state.questionHistory:[];state.customExams=Array.isArray(state.customExams)?state.customExams:[];state.adaptiveHistory=Array.isArray(state.adaptiveHistory)?state.adaptiveHistory:[];state.recycleBinV26=state.recycleBinV26&&typeof state.recycleBinV26==='object'?state.recycleBinV26:{questions:[],customExams:[]};state.recycleBinV26.questions=Array.isArray(state.recycleBinV26.questions)?state.recycleBinV26.questions:[];state.recycleBinV26.customExams=Array.isArray(state.recycleBinV26.customExams)?state.recycleBinV26.customExams:[];state.studentPlanV28=state.studentPlanV28&&typeof state.studentPlanV28==='object'?state.studentPlanV28:{targetScore:8,dailyMinutes:35,weeklyDays:5,updatedAt:''};
// : dọn đúng seed demo  cũ nếu thiết bị chưa có bất kỳ dấu hiệu học tập thật nào.
const V23_LEGACY_DEMO_DONE=['F1-01','F1-02','F1-03','F2-01'];
const v23PreviousSchema=Number(state?._meta?.schemaVersion)||0;
const v23OnlyLegacyDemo=state.done.length===V23_LEGACY_DEMO_DONE.length&&V23_LEGACY_DEMO_DONE.every(x=>state.done.includes(x))&&!(state.attempts||[]).length&&!(state.examAttempts||[]).length&&!(state.questionHistory||[]).length&&!Object.keys(state.lessonScores||{}).length;
if(v23PreviousSchema<23&&v23OnlyLegacyDemo){state.done=[];state.mastered={};}
state._meta=state._meta&&typeof state._meta==='object'?state._meta:{};state._meta.schemaVersion=34;state._meta.deviceId=state._meta.deviceId||v21DeviceId();state._meta.revision=Number(state._meta.revision)||0;if(localStateLoadError)state._meta.localLoadError=localStateLoadError;
// Tương thích dữ liệu V2: bài đã hoàn thành được ánh xạ sang các chuẩn kiến thức con.
state.done.forEach(id=>{if(!state.mastered[id])state.mastered[id]=getLessonMeta(id).knowledge.map(k=>k.code)});
let activeChapter=1;
let firebaseApp=null,firebaseAuth=null,firebaseDb=null,firebaseAppCheck=null,firebaseAppCheckStatus='not-configured',firebaseUser=null,firebaseProfile=null,firebaseAccountLocked=false;
let firebaseReady=false,firebaseHydrating=false,firebaseSyncTimer=null,firebaseMemberships=[],firebaseOwnedClasses=[],firebaseTrashedClasses=[],firebaseInitError='',firebaseLastTeacherHash='',firebaseSelectedClassId='',firebaseStudentAssignments=[],firebaseAssignmentLoading=false,firebaseNotificationItems=[],firebaseNotificationLoading=false,firebaseNotificationClassId='',firebaseSmartTargetPreset='all';
function save(options={}){
  // : every persistence path writes the canonical Chapter-1 taxonomy.
  // persist:false prevents recursion because syncState itself may call save when used elsewhere.
  try{window.v3821Taxonomy?.syncState?.({persist:false,sync:false})}catch(_){}
  state._meta=state._meta||{};state._meta.schemaVersion=34;state._meta.deviceId=state._meta.deviceId||v21DeviceId();state._meta.revision=(Number(state._meta.revision)||0)+1;state._meta.updatedAt=new Date().toISOString();state._meta.lastSaveReason=options.reason||'save';
  let serialized=JSON.stringify(state);
  try{localStorage.setItem(LOCAL_STATE_KEY,serialized);state._meta.storageMode='localStorage+IndexedDB'}catch(err){state._meta.storageWarning='localStorage không đủ chỗ;  đang dùng kho cứu hộ IndexedDB.';if(typeof v21HandleStorageQuota==='function')v21HandleStorageQuota(serialized,err);else console.error(err)}
  if(typeof v21MirrorState==='function')v21MirrorState();
  if(options.sync!==false&&typeof scheduleFirebaseSync==='function')scheduleFirebaseSync();
}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}

// V5: chuyển các công thức Unicode cũ sang TeX và vẫn hỗ trợ LaTeX nhập trực tiếp.
function unicodeMathToTex(expr){
  let t=String(expr).trim();
  const subMap={'₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9','₋':'-'};
  const supMap={'⁰':'0','¹':'1','²':'2','³':'3','⁴':'4','⁵':'5','⁶':'6','⁷':'7','⁸':'8','⁹':'9','⁻':'-'};
  // Tích phân có cận Unicode, ví dụ ∫₀¹.
  t=t.replace(/∫([₀₁₂₃₄₅₆₇₈₉₋]*)([⁰¹²³⁴⁵⁶⁷⁸⁹⁻]*)/g,(_,lo,hi)=>'\\int'+(lo?'_{'+[...lo].map(c=>subMap[c]||c).join('')+'}':'')+(hi?'^{'+[...hi].map(c=>supMap[c]||c).join('')+'}':''));
  t=t.replace(/([A-Za-z0-9)\]])([²³])/g,(_,a,b)=>a+'^{'+supMap[b]+'}');
  t=t.replace(/√\[([^\]]+)\]/g,'\\sqrt{$1}');
  t=t.replace(/√\(([^)]+)\)/g,'\\sqrt{($1)}');
  t=t.replace(/√([A-Za-z0-9]+(?:\^\{?\d+\}?)?)/g,'\\sqrt{$1}');
  t=t.replaceAll('−','-').replaceAll('∞','\\infty').replaceAll('→','\\to ').replaceAll('∩','\\cap ').replaceAll('∪','\\cup ').replaceAll('·','\\cdot ').replaceAll('×','\\times ').replaceAll('≈','\\approx ').replaceAll('≤','\\le ').replaceAll('≥','\\ge ');
  // Xác suất có điều kiện và các phân thức xác suất.
  t=t.replace(/(P\([^)]*\))\/(P\([^)]*\))/g,'\\frac{$1}{$2}');
  t=t.replace(/P\(([^)]*)\)/g,(_,inside)=>'P('+inside.replaceAll('|','\\mid ')+')');
  // Một số phân thức cơ bản dạng (A)/(B) và a/b.
  for(let i=0;i<2;i++)t=t.replace(/\(([^()]+)\)\/\(([^()]+)\)/g,'\\frac{$1}{$2}');
  t=t.replace(/\b([0-9A-Za-z]+)\/([0-9A-Za-z]+)\b/g,'\\frac{$1}{$2}');
  // Dấu phẩy thập phân không tạo khoảng cách kiểu dấu câu trong TeX.
  t=t.replace(/(\d),(\d)/g,'$1{,}$2');
  t=t.replace(/\bd([xyz])\b/g,'\\,d$1');
  return t.trim();
}
function mathHTML(value){
  let s=String(value??'');
  const saved=[];
  const hold=raw=>{saved.push(raw);return `\uE000${saved.length-1}\uE001`};
  // Giữ nguyên LaTeX do giáo viên nhập.
  s=s.replace(/\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g,hold);
  const mathTail='[0-9A-Za-z_()\\[\\]{}+\\-−=<>≤≥·×*/^²³√∞→∩∪|,:;\'\\s≈]+';
  const patterns=[
    /∫[^.;!?]*(?:d[xyt])/g,
    /P\([^)]*\)(?:\s*=\s*[0-9PAB()∩|/=+\-−*.,\s]+)?/g,
    new RegExp('(?:[A-Z]{1,2}|[fFyxsSRId])(?:[\\\'′]?\\([^)]*\\))?\\s*(?:=|[<>≤≥])\\s*'+mathTail,'g'),
    new RegExp('[fFy][\\\'′]?\\s*(?:[<>≤≥])\\s*'+mathTail,'g'),
    new RegExp('\\|[A-Za-z]+\\|\\s*=\\s*'+mathTail,'g'),
    /(?:[A-Za-z]{1,2})\s*=\s*\([^)]*\)/g,
    /(?:[A-Za-z]{1,2})\s*[·]\s*(?:[A-Za-z]{1,2})(?:\s*=\s*[^.;!?\s]+)?/g,
    /(?:[A-Z]{1,2})\([^)]*;[^)]*\)/g,
    /√(?:\[[^\]]+\]|\([^)]*\)|[0-9A-Za-z²³^+\-−]+)/g,
    /[\[(][+\-−]?(?:∞|\d+(?:[.,]\d+)?)[;,][+\-−]?(?:∞|\d+(?:[.,]\d+)?)[\])]/g
  ];
  const splitMathMatch=m=>{let suffix='';m=m.replace(/\s+([A-Za-z]{2,})$/,(all,w)=>{if(['dx','dy','dz','sin','cos','tan','ln','log','max','min'].includes(w))return all;suffix=all;return ''});return [m,suffix]};
  patterns.forEach(re=>{s=s.replace(re,m=>{if(m.includes('\uE000'))return m;const [core,suffix]=splitMathMatch(m);return hold('\\('+unicodeMathToTex(core.trim())+'\\)')+suffix})});
  s=esc(s);
  s=s.replace(/\uE000(\d+)\uE001/g,(_,i)=>esc(saved[Number(i)]||''));
  return `<span class="math-rich">${s}</span>`;
}
let mathTypesetTimer=null;
function typesetMath(root=document){
  clearTimeout(mathTypesetTimer);
  mathTypesetTimer=setTimeout(()=>{
    if(!window.MathJax?.typesetPromise)return;
    const target=root&&root.isConnected!==false?root:document;
    try{window.MathJax.typesetPromise([target]).catch(()=>{});}catch(_){ }
  },20);
}
window.addEventListener('load',()=>typesetMath(document.querySelector('.section.active')||document));
function percent(n,d){return Math.round(n/d*100)}
function chapterDone(c){return c.lessons.filter(l=>state.done.includes(l.id)).length}
function chapterCard(c){let d=chapterDone(c),p=percent(d,c.lessons.length);return `<div class="card chapter"><div class="chapter-no">Chương ${c.id}</div><h4>${esc(c.title)}</h4><p>${esc(c.desc)}</p><div class="chapter-meta"><span class="pill">${c.lessons.length} chủ đề</span><span class="pill">${d}/${c.lessons.length} hoàn thành</span></div><div class="progress"><span style="width:${p}%"></span></div><button class="btn ${p===100?'btn-soft':'btn-blue'}" onclick="selectChapter(${c.id});goPage('lessons')">${p===100?'Ôn lại chương':'Học chương này'}</button></div>`}
function learningStreakDays(){
  const dayKey=v=>{let d=new Date(v);if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const days=new Set();(state.examAttempts||[]).forEach(x=>{let k=dayKey(x.date);if(k)days.add(k)});(state.attempts||[]).forEach(x=>{let k=dayKey(x.date);if(k)days.add(k)});(state.questionHistory||[]).forEach(x=>{let k=dayKey(x.date);if(k)days.add(k)});
  if(!days.size)return 0;let d=new Date();d.setHours(0,0,0,0);let today=dayKey(d),y=new Date(d);y.setDate(y.getDate()-1);if(!days.has(today)&&!days.has(dayKey(y)))return 0;if(!days.has(today))d=y;let n=0;while(days.has(dayKey(d))){n++;d.setDate(d.getDate()-1)}return n
}
function renderDashboard(){document.getElementById('dashboardChapters').innerHTML=chapters.map(chapterCard).join('');document.getElementById('allChapters').innerHTML=chapters.map(c=>chapterCard(c).replace('Học chương này','Làm bài ôn chương')).join('');let d=state.done.length,p=percent(d,TOTAL);document.getElementById('heroPercent').textContent=p+'%';document.getElementById('heroBar').style.width=p+'%';document.getElementById('doneLessonText').textContent=`${d}/${TOTAL} bài đã hoàn thành`;let streak=document.getElementById('learningStreakText');if(streak)streak.textContent=`Chuỗi học: ${learningStreakDays()} ngày`;document.getElementById('metricLessons').textContent=d;let metricStreak=document.getElementById('metricStreak');if(metricStreak)metricStreak.textContent=learningStreakDays();let a=analyticsOverallStats(),attempts=state.examAttempts||[];document.getElementById('metricAvg')&&(document.getElementById('metricAvg').textContent=attempts.length?(attempts.reduce((s,x)=>s+Number(x.score||0),0)/attempts.length).toFixed(1):'—');document.getElementById('metricAccuracy')&&(document.getElementById('metricAccuracy').textContent=a.accuracy==null?'—':Math.round(a.accuracy*100)+'%');let weak=analyticsWeakSkills(3);document.getElementById('weakList').innerHTML=weak.length?weak.map((x,i)=>`<div class="weak-card" style="padding:9px 0;border-bottom:1px solid var(--line)"><div style="display:flex;align-items:center;gap:10px"><div class="rank">${i+1}</div><div><b>${esc(x.title)}</b><div style="color:var(--muted);font-size:12px">${esc(displayKnowledgeCode(x.code))} • độ chính xác ${Math.round(x.accuracy*100)}%</div></div></div><button class="btn btn-soft" onclick="startAdaptivePractice(6,'${attrEsc(x.code)}')">Ôn ngay</button></div>`).join(''):'<div class="notice">Hãy làm bài kiểm tra để  xác định các mã kiến thức cần củng cố.</div>'}
function renderChapterTabs(){document.getElementById('chapterTabs').innerHTML=chapters.map(c=>`<button class="chapter-tab ${c.id===activeChapter?'active':''}" onclick="selectChapter(${c.id})"><b>Chương ${c.id}</b><small>${esc(c.title)}</small></button>`).join('')}
function renderLessons(){renderChapterTabs();let c=chapters.find(x=>x.id===activeChapter);let q=(document.getElementById('lessonSearch')?.value||'').toLowerCase();document.getElementById('lessonHeader').innerHTML=`<h3 style="margin:0">Chương ${c.id}. ${esc(c.title)}</h3><p style="color:var(--muted);font-size:13px">${esc(c.desc)}</p><div class="skill-stats"><span class="pill">${c.lessons.length} bài</span><span class="pill">${c.lessons.reduce((n,l)=>n+getLessonMeta(l.id).knowledge.length,0)} chuẩn kiến thức</span></div>`;let rows=c.lessons.filter(l=>{let m=getLessonMeta(l.id),text=[l.common,...m.goals,...m.knowledge.map(k=>k.title),...m.forms.map(f=>f.title)].join(' ').toLowerCase();return text.includes(q)}).map((l,i)=>{let done=state.done.includes(l.id),m=getLessonMeta(l.id),mastered=(state.mastered[l.id]||[]).length,score=state.lessonScores[l.id];return `<div class="lesson-row"><div class="lesson-index">${i+1}</div><div><h4>${esc(l.common)}</h4><p>Mã bài: ${l.id} • ${m.minutes} phút học gợi ý${score!=null?'Điểm kiểm tra: '+score+'/10':''}</p><div class="lesson-mini-meta"><span class="pill">${m.knowledge.length} kiến thức</span><span class="pill">${m.forms.length} dạng toán</span><span class="pill ${done?'tag-green':''}">${done?'Đã hoàn thành':mastered+'/'+m.knowledge.length+' kiến thức đã nắm'}</span></div></div><div class="lesson-actions"><span class="status-dot ${done?'done':''}"></span><button class="btn ${done?'btn-soft':'btn-blue'}" onclick="openLesson('${l.id}')">${done?'Ôn lại bài':'Mở bài học'}</button></div></div>`}).join('');document.getElementById('lessonList').innerHTML=rows||'<div class="notice">Không tìm thấy bài phù hợp.</div>'}

function selectChapter(id){activeChapter=id;renderLessons()}

let activeLessonId='F1-01';
function openLesson(id){activeLessonId=id;let item=getLesson(id);if(item)activeChapter=item.chapter.id;renderLessonDetail();goPage('lesson-detail')}
function renderLessonDetail(){let item=getLesson(activeLessonId);if(!item)return;let m=getLessonMeta(activeLessonId),mastered=state.mastered[activeLessonId]||[],done=state.done.includes(activeLessonId),score=state.lessonScores[activeLessonId],studyPct=done?100:Math.round((mastered.length/(m.knowledge.length+1))*100);let knowledge=m.knowledge.map(k=>`<div class="knowledge-item ${mastered.includes(k.code)?'mastered':''}"><div><span class="knowledge-code">${k.code}</span><h4>${esc(k.title)}</h4><div class="knowledge-summary">${mathHTML(k.summary)}</div><div style="margin-top:8px"><span class="level-badge ${levelClass(k.level)}">${levelName(k.level)}</span></div></div><button class="btn ${mastered.includes(k.code)?'btn-soft':'btn-blue'}" onclick="toggleKnowledge('${activeLessonId}','${k.code}')">${mastered.includes(k.code)?'✓ Đã nắm':'Đánh dấu đã nắm'}</button></div>`).join('');let forms=m.forms.map((f,i)=>`<div class="form-card"><div class="form-no">DẠNG ${i+1} • ${levelName(f.level)}</div><h4>${esc(f.title)}</h4><p><b>Gợi ý:</b> ${mathHTML(f.tip)}</p></div>`).join('');let objectives=m.goals.map(g=>`<div class="objective-item"><span class="checkmark">✓</span><div>${mathHTML(g)}</div></div>`).join('');let mistakes=m.mistakes.map(x=>`<div class="mistake-item"><b>!</b><span>${mathHTML(x)}</span></div>`).join('');document.getElementById('lessonDetail').innerHTML=`
 <button class="link-btn" onclick="goPage('lessons')" style="margin-bottom:12px">← Trở lại danh sách bài</button>
 <div class="lesson-detail-hero"><div><div class="badge" style="background:rgba(255,255,255,.15);color:white">Chương ${item.chapter.id} • ${activeLessonId}</div><h2>${esc(item.common)}</h2><p>${esc(item.chapter.desc)}</p><div class="lesson-detail-actions"><button class="btn btn-primary" onclick="document.getElementById('lessonKnowledge').scrollIntoView({behavior:'smooth'})">Bắt đầu học</button><button class="btn btn-ghost" onclick="openLessonQuiz('${activeLessonId}')">Kiểm tra sau bài</button></div></div><div class="lesson-detail-side"><small>Tiến độ bài học</small><div style="font-size:32px;font-weight:900;margin:4px 0">${studyPct}%</div><div class="progress"><span style="width:${studyPct}%"></span></div><div style="font-size:12px;color:#dce6ff;margin-top:9px">${mastered.length}/${m.knowledge.length} kiến thức đã nắm${score!=null?'Điểm gần nhất '+score+'/10':''}</div></div></div>
 <div class="study-layout mt"><div class="study-main">
  <div class="study-card"><div class="study-kicker">01 • Mục tiêu</div><h3>Sau bài này em cần làm được gì?</h3><div class="objective-list">${objectives}</div></div>
  <div class="study-card" id="lessonKnowledge"><div class="study-kicker">02 • Kiến thức cần nhớ</div><h3>Chuẩn kiến thức của bài</h3><div class="notice" style="margin-bottom:14px"><b>Mã hóa kiến thức:</b> mỗi mục có mã riêng để sau này câu hỏi, điểm số và lỗi sai đều truy ngược chính xác về nội dung học sinh chưa vững.</div><div class="formula-demo"><b>Hiển thị công thức V5</b><span class="math-rich">\\(f'(x)=3x^2-3,\\quad \\int_0^1 2x\\,dx=1,\\quad P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}\\)</span></div><div class="knowledge-list">${knowledge}</div></div>
  <div class="study-card"><div class="study-kicker">03 • Dạng toán</div><h3>Các dạng cần luyện</h3><div class="form-grid">${forms}</div></div>
  <div class="study-card"><div class="study-kicker">04 • Ví dụ mẫu</div><h3>Ví dụ trọng tâm</h3><div class="example-box"><b>Bài toán.</b> ${mathHTML(m.example.problem)}<div class="solution"><b>Lời giải định hướng.</b> ${mathHTML(m.example.solution)}</div></div></div>
  <div class="study-card"><div class="study-kicker">05 • Luyện tập & kiểm tra</div><h3>Củng cố ngay sau bài học</h3><p style="color:var(--muted);font-size:13px">Bản V5 lấy câu trực tiếp từ ngân hàng chuẩn hóa và hiển thị công thức bằng MathJax/LaTeX. Mỗi lượt kiểm tra ưu tiên phủ các mã kiến thức của bài và lưu lịch sử đúng/sai theo từng câu.</p><div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn-blue" onclick="openLessonQuiz('${activeLessonId}')">Làm kiểm tra sau bài</button><button class="btn btn-soft" onclick="markLessonStudied('${activeLessonId}')">${done?'✓ Bài đã hoàn thành':'Đánh dấu đã học xong'}</button></div></div>
  <div class="study-card"><div class="study-kicker">06 • Lỗi thường gặp</div><h3>Những điểm cần tránh</h3><div class="mistake-list">${mistakes}</div></div>
 </div><aside class="study-aside">
  <div class="study-card"><h3 style="margin-bottom:10px">Lộ trình 45–55 phút</h3><div class="study-steps"><div class="study-step"><span>1</span><div><b>Ôn kiến thức</b><small>10–15 phút</small></div></div><div class="study-step"><span>2</span><div><b>Xem dạng toán</b><small>10 phút</small></div></div><div class="study-step"><span>3</span><div><b>Làm ví dụ</b><small>10 phút</small></div></div><div class="study-step"><span>4</span><div><b>Luyện & kiểm tra</b><small>15–20 phút</small></div></div></div></div>
  <div class="study-card"><h3 style="margin-bottom:9px">Mức độ bài</h3><div class="skill-stats"><span class="level-badge nb">Nhận biết</span><span class="level-badge th">Thông hiểu</span><span class="level-badge vd">Vận dụng</span></div><p style="font-size:12px;color:var(--muted);margin-bottom:0">Câu hỏi hiện đã được gắn mã kiến thức và mức độ; dữ liệu này là nền tảng cho lộ trình cá nhân hóa ở bước tiếp theo.</p></div>
  <div class="study-card"><h3 style="margin-bottom:9px">Kết quả gần nhất</h3>${score!=null?`<div class="lesson-score">${score}/10</div><small style="color:var(--muted)">Điểm kiểm tra sau bài</small>`:'<div style="color:var(--muted);font-size:13px">Chưa có lượt kiểm tra.</div>'}</div>
 </aside></div>`;typesetMath(document.getElementById('lessonDetail'))}
function toggleKnowledge(lessonId,code){let arr=state.mastered[lessonId]||[];state.mastered[lessonId]=arr.includes(code)?arr.filter(x=>x!==code):[...arr,code];save();renderLessonDetail();renderLessons()}
function markLessonStudied(id){if(!state.done.includes(id))state.done.push(id);save();renderAll();renderLessonDetail()}

;

/* ===== assets/js/id6-taxonomy-v37.4.js ===== */
/* =========================================================
   Math12 Hub  — Official ID6 Taxonomy
   Source: “DANH MỤC ID 6 THAM SỐ, MÔN TOÁN 10-11-12” (2024).
   Important: ID6 is a classification code, not a unique database key.
   Existing q.id remains the unique internal record id.
   ========================================================= */
(function(){
  'use strict';
  const BUILD='37.4-official-id6-taxonomy';
  const LEVEL_LETTER={NB:'N',TH:'H',VD:'V',VDC:'C'};
  const LEVEL_LABEL={NB:'Nhận biết',TH:'Thông hiểu',VD:'Vận dụng',VDC:'Vận dụng cao'};
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const F=(id6Pattern,title,officialLessonTitle)=>({id:id6Pattern,id6Pattern,title,officialLessonTitle,officialId6:true});

    // : Chương 1 được căn thẳng với 5 bài chính thức.
  // Mỗi lessonId F1-01...F1-05 tương ứng đúng bài 1...5 trong ID6.
  const BY_APP_LESSON={
    'F1-01':[
      F('2D1?1-1','Xét tính đơn điệu của hàm số cho bởi công thức','Sự đồng biến và nghịch biến của hàm số'),
      F('2D1?1-2','Xét tính đơn điệu dựa vào bảng biến thiên, đồ thị','Sự đồng biến và nghịch biến của hàm số'),
      F('2D1?1-3','Tìm tham số m để hàm số đơn điệu','Sự đồng biến và nghịch biến của hàm số'),
      F('2D1?1-4','Ứng dụng tính đơn điệu để chứng minh bất đẳng thức, giải phương trình, bất phương trình, hệ phương trình','Sự đồng biến và nghịch biến của hàm số'),
      F('2D1?1-5','Toán thực tế ứng dụng sự đồng biến nghịch biến','Sự đồng biến và nghịch biến của hàm số')
    ],
    'F1-02':[
      F('2D1?2-1','Tìm cực trị của hàm số cho bởi công thức','Cực trị của hàm số'),
      F('2D1?2-2','Tìm cực trị dựa vào BBT, đồ thị','Cực trị của hàm số'),
      F('2D1?2-3','Tìm m để hàm số đạt cực trị tại 1 điểm x0 cho trước','Cực trị của hàm số'),
      F('2D1?2-4','Tìm m để hàm số, đồ thị hàm số bậc ba có cực trị thỏa mãn điều kiện','Cực trị của hàm số'),
      F('2D1?2-5','Tìm m để hàm số, đồ thị hàm số trùng phương có cực trị thỏa mãn điều kiện','Cực trị của hàm số'),
      F('2D1?2-6','Tìm m để hàm số, đồ thị hàm số các hàm số khác có cực trị thỏa mãn điều kiện','Cực trị của hàm số'),
      F('2D1?2-7','Toán thực tế ứng dụng cực trị của hàm số','Cực trị của hàm số')
    ],
    'F1-03':[
      F('2D1?3-1','GTLN, GTNN trên đoạn [a; b]','Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'),
      F('2D1?3-2','GTLN, GTNN trên khoảng','Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'),
      F('2D1?3-3','Sử dụng các đánh giá, bất đẳng thức cổ điển','Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'),
      F('2D1?3-4','Ứng dụng GTNN, GTLN trong bài toán phương trình, bất phương trình, hệ phương trình','Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'),
      F('2D1?3-5','GTLN, GTNN hàm nhiều biến','Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'),
      F('2D1?3-6','Toán thực tế ứng dụng GTLN, GTNN của hàm số','Giá trị lớn nhất và giá trị nhỏ nhất của hàm số')
    ],
    'F1-04':[
      F('2D1?4-1','Bài toán xác định các đường tiệm cận của hàm số (không chứa tham số) hoặc biết BBT, đồ thị','Đường tiệm cận'),
      F('2D1?4-2','Bài toán xác định các đường tiệm cận của hàm số có chứa tham số','Đường tiệm cận'),
      F('2D1?4-3','Bài toán liên quan đến đồ thị hàm số và các đường tiệm cận','Đường tiệm cận'),
      F('2D1?4-4','Toán thực tế ứng dụng tiệm cận','Đường tiệm cận')
    ],
    'F1-05':[
      F('2D1?5-1','Nhận dạng đồ thị','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-2','Các phép biến đổi đồ thị','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-3','Biện luận số giao điểm dựa vào đồ thị, bảng biến thiên','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-4','Sự tương giao của hai đồ thị (liên quan đến tọa độ giao điểm)','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-5','Đồ thị của hàm đạo hàm','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-6','Phương trình tiếp tuyến của đồ thị hàm số','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-7','Điểm đặc biệt của đồ thị hàm số','Khảo sát sự biến thiên và vẽ đồ thị hàm số'),
      F('2D1?5-8','Toán thực tế ứng dụng khảo sát hàm số','Khảo sát sự biến thiên và vẽ đồ thị hàm số')
    ],
    'F2-01':[
      F('2H2?1-1','Công thức lý thuyết','Véc-tơ và các phép toán véc-tơ trong không gian (chưa toạ độ hoá)'),
      F('2H2?1-2','Tổng, hiệu, tích một số với véc-tơ','Véc-tơ và các phép toán véc-tơ trong không gian (chưa toạ độ hoá)'),
      F('2H2?1-3','Tích vô hướng và ứng dụng','Véc-tơ và các phép toán véc-tơ trong không gian (chưa toạ độ hoá)'),
      F('2H2?1-4','Toán thực tế áp dụng các phép toán véc-tơ','Véc-tơ và các phép toán véc-tơ trong không gian (chưa toạ độ hoá)')
    ],
    'F2-02':[
      F('2H2?2-1','Công thức lý thuyết','Toạ độ của véc-tơ và các công thức'),
      F('2H2?2-2','Tìm tọa độ điểm','Toạ độ của véc-tơ và các công thức'),
      F('2H2?2-3','Tìm tọa độ véc-tơ','Toạ độ của véc-tơ và các công thức')
    ],
    'F2-03':[
      F('2H2?2-4','Công thức toạ độ của tích vô hướng và ứng dụng','Toạ độ của véc-tơ và các công thức'),
      F('2H2?2-5','Công thức toạ độ của tích có hướng và ứng dụng','Toạ độ của véc-tơ và các công thức'),
      F('2H2?2-6','Toán thực tế áp dụng các phép toán toạ độ hoá véc-tơ','Toạ độ của véc-tơ và các công thức')
    ],
    'F3-01':[
      F('2D3?1-1','Công thức lý thuyết','Khoảng biến thiên, khoảng tứ phân vị của mẫu số liệu ghép nhóm'),
      F('2D3?1-2','Tìm khoảng biến thiên','Khoảng biến thiên, khoảng tứ phân vị của mẫu số liệu ghép nhóm'),
      F('2D3?1-3','Tìm khoảng tứ phân vị','Khoảng biến thiên, khoảng tứ phân vị của mẫu số liệu ghép nhóm'),
      F('2D3?1-4','Câu hỏi tổng hợp','Khoảng biến thiên, khoảng tứ phân vị của mẫu số liệu ghép nhóm')
    ],
    'F3-02':[
      F('2D3?2-1','Công thức lý thuyết','Phương sai, độ lệch chuẩn của mẫu số liệu ghép nhóm'),
      F('2D3?2-2','Tìm phương sai, độ lệch chuẩn','Phương sai, độ lệch chuẩn của mẫu số liệu ghép nhóm'),
      F('2D3?2-3','Câu hỏi tổng hợp','Phương sai, độ lệch chuẩn của mẫu số liệu ghép nhóm')
    ],
    'F4-01':[
      F('2D4?1-1','Công thức lý thuyết','Nguyên hàm'),
      F('2D4?1-2','Nguyên hàm cơ bản đa thức, phân thức','Nguyên hàm'),
      F('2D4?1-3','Nguyên hàm cơ bản hàm lượng giác','Nguyên hàm'),
      F('2D4?1-4','Nguyên hàm cơ bản hàm mũ, luỹ thừa','Nguyên hàm'),
      F('2D4?1-5','Phương pháp đổi biến số cơ bản','Nguyên hàm'),
      F('2D4?1-6','Toán thực tế áp dụng nguyên hàm','Nguyên hàm')
    ],
    'F4-02':[
      F('2D4?2-1','Công thức lý thuyết','Tích phân'),
      F('2D4?2-2','Tích phân cơ bản đa thức, phân thức','Tích phân'),
      F('2D4?2-3','Tích phân cơ bản hàm lượng giác','Tích phân'),
      F('2D4?2-4','Tích phân cơ bản hàm mũ, luỹ thừa','Tích phân'),
      F('2D4?2-5','Phương pháp đổi biến số cơ bản','Tích phân'),
      F('2D4?2-6','Toán thực tế áp dụng nguyên hàm','Tích phân')
    ],
    'F4-03':[
      F('2D4?3-1','Diện tích hình phẳng được giới hạn bởi các đồ thị','Ứng dụng thực tế và hình học của tích phân'),
      F('2D4?3-2','Bài toán thực tế sử dụng diện tích hình phẳng','Ứng dụng thực tế và hình học của tích phân'),
      F('2D4?3-3','Thể tích giới hạn bởi các đồ thị (tròn xoay)','Ứng dụng thực tế và hình học của tích phân'),
      F('2D4?3-4','Thể tích tính theo mặt cắt S(x)','Ứng dụng thực tế và hình học của tích phân'),
      F('2D4?3-5','Bài toán thực tế và ứng dụng thể tích tròn xoay, S(x)','Ứng dụng thực tế và hình học của tích phân')
    ],
    'F5-01':[
      F('2H5?1-1','Câu hỏi lý thuyết','Phương trình mặt phẳng'),
      F('2H5?1-2','Xác định véc-tơ pháp tuyến, cặp véc-tơ chỉ phương','Phương trình mặt phẳng'),
      F('2H5?1-3','Viết phương trình tổng quát mặt phẳng','Phương trình mặt phẳng'),
      F('2H5?1-4','Vị trí tương đối giữa hai mặt phẳng (song song, vuông góc)','Phương trình mặt phẳng'),
      F('2H5?1-7','Toán thực tế áp dụng phương trình mặt phẳng','Phương trình mặt phẳng')
    ],
    'F5-02':[
      F('2H5?2-1','Câu hỏi lý thuyết','Phương trình đường thẳng trong không gian'),
      F('2H5?2-2','Xác định véc-tơ chỉ phương, cặp véc-tơ pháp tuyến','Phương trình đường thẳng trong không gian'),
      F('2H5?2-3','Viết phương trình tổng quát, chính tắc, tham số đường thẳng','Phương trình đường thẳng trong không gian'),
      F('2H5?2-4','Vị trí tương đối giữa hai đường thẳng','Phương trình đường thẳng trong không gian'),
      F('2H5?2-5','Vị trí tương đối giữa đường thẳng và mặt phẳng','Phương trình đường thẳng trong không gian'),
      F('2H5?2-8','Toán thực tế áp dụng phương trình đường thẳng','Phương trình đường thẳng trong không gian')
    ],
    'F5-03':[
      F('2H5?1-5','Khoảng cách điểm tới mặt phẳng','Phương trình mặt phẳng'),
      F('2H5?1-6','Góc giữa hai mặt phẳng','Phương trình mặt phẳng'),
      F('2H5?2-6','Khoảng cách điểm tới đường thẳng','Phương trình đường thẳng trong không gian'),
      F('2H5?2-7','Góc giữa hai đường thẳng, đường thẳng và mặt phẳng','Phương trình đường thẳng trong không gian')
    ],
    'F5-04':[
      F('2H5?3-1','Câu hỏi lý thuyết','Phương trình mặt cầu trong không gian'),
      F('2H5?3-2','Xác định tâm, bán kính, đường kính mặt cầu','Phương trình mặt cầu trong không gian'),
      F('2H5?3-3','Viết phương trình tổng quát mặt cầu','Phương trình mặt cầu trong không gian'),
      F('2H5?3-4','Toán thực tế áp dụng phương trình mặt cầu','Phương trình mặt cầu trong không gian')
    ],
    'F6-01':[
      F('2D6?1-1','Công thức lý thuyết','Xác suất có điều kiện'),
      F('2D6?1-2','Tính xác suất có điều kiện bằng công thức','Xác suất có điều kiện'),
      F('2D6?1-3','Tính xác suất có điều kiện bằng sơ đồ cây','Xác suất có điều kiện'),
      F('2D6?1-4','Bài toán tổng hợp','Xác suất có điều kiện')
    ],
    'F6-02':[
      F('2D6?2-1','Công thức lý thuyết','Công thức xác suất toàn phần. Công thức Bayes'),
      F('2D6?2-2','Tính xác suất bằng công thức xác suất toàn phần','Công thức xác suất toàn phần. Công thức Bayes'),
      F('2D6?2-3','Tính xác suất bằng công thức xác suất Bayes','Công thức xác suất toàn phần. Công thức Bayes'),
      F('2D6?2-4','Bài toán tổng hợp','Công thức xác suất toàn phần. Công thức Bayes')
    ]
  };

  // Strong aliases from the former  form names → official ID6 patterns.
  const ALIASES={
    'xet khoang dong bien nghich bien':'2D1?1-1',
    'tim gtln gtnn tren doan':'2D1?3-1','tim gtln gtnn tu bang bien thien':'2D1?3-2','bai toan toi uu thuc tien':'2D1?3-6',
    'tim tiem can cua ham phan thuc':'2D1?4-1','doc tiem can tu bang bien thien do thi':'2D1?4-1','tim tiem can xien':'2D1?4-1',
    'khao sat ham da thuc':'2D1?5-1','khao sat ham phan thuc':'2D1?5-1','bien luan so nghiem bang do thi':'2D1?5-3',
    'toi uu hinh hoc':'2D1?3-6','toi uu chi phi doanh thu':'2D1?3-6','toi uu chuyen dong':'2D1?3-6',
    'tinh tong hieu vecto':'2H2?1-2','chung minh cung phuong':'2H2?1-2','bieu dien vecto theo vecto co so':'2H2?1-2',
    'tinh toa do vecto':'2H2?2-3','tinh khoang cach trung diem':'2H2?2-2','tim toa do diem theo dieu kien vecto':'2H2?2-2',
    'tinh tich vo huong':'2H2?2-4','tinh goc giua hai vecto':'2H2?2-4','tim tham so de vuong goc cung phuong':'2H2?2-4',
    'tinh khoang bien thien':'2D3?1-2','xac dinh lop chua tu phan vi':'2D3?1-3','so sanh muc do phan tan':'2D3?1-4',
    'tinh phuong sai tu bang ghep nhom':'2D3?2-2','tinh do lech chuan':'2D3?2-2','so sanh do on dinh':'2D3?2-3',
    'nguyen ham truc tiep':'2D4?1-2','dung tinh tuyen tinh':'2D4?1-1','nhan dang ham hop':'2D4?1-5',
    'tinh tich phan truc tiep':'2D4?2-2','dung tinh chat tich phan':'2D4?2-1','doi bien don gian':'2D4?2-5',
    'dien tich duoi do thi':'2D4?3-1','dien tich giua hai duong':'2D4?3-1','the tich vat the tron xoay':'2D4?3-3',
    'viet mat phang qua diem biet vtpt':'2H5?1-3','tim vtpt tu du kien hinh hoc':'2H5?1-2','mat phang theo tham so':'2H5?1-3',
    'viet duong thang qua diem biet vtcp':'2H5?2-3','duong thang qua hai diem':'2H5?2-3','xet vi tri tuong doi':'2H5?2-4',
    'khoang cach diem den mat phang':'2H5?1-5','goc giua hai duong hai mat phang':'2H5?2-7','goc duong thang mat phang':'2H5?2-7',
    'doc tam ban kinh':'2H5?3-2','viet mat cau biet tam ban kinh':'2H5?3-3','mat cau tiep xuc mat phang':'2H5?3-4',
    'tinh truc tiep p a b':'2D6?1-2','tinh xac suat giao':'2D6?1-2','bai toan bang 2x2 cay xac suat':'2D6?1-3',
    'xac suat toan phan':'2D6?2-2','bayes hai nhom':'2D6?2-3','bai toan thuc te nhieu nhanh':'2D6?2-4'
  };

  function allForms(){return Object.values(BY_APP_LESSON).flat()}
  function levelLetter(level){return LEVEL_LETTER[String(level||'').toUpperCase()]||''}
  function buildId6(pattern,level){const p=String(pattern||'');const L=levelLetter(level);return p&&L?p.replace('?',L):''}
  function isPattern(v){return /^2[DH]\d\?\d+-\d+$/.test(String(v||''))}
  function isId6(v){return /^2[DH]\d[NHVC]\d+-\d+$/.test(String(v||''))}
  function formByPattern(pattern){return allForms().find(f=>f.id6Pattern===pattern)||null}
  function inferPattern(q={}){
    if(isPattern(q.id6Pattern))return q.id6Pattern;
    if(isPattern(q.formId))return q.formId;
    if(isId6(q.id6))return q.id6.replace(/^(.{3})[NHVC](.+)$/,'$1?$2');
    const a=ALIASES[norm(q.form||q.formTitle||'')];if(a)return a;
    const txt=norm(`${q.question||''} ${q.form||''}`);
    if(q.lessonId==='F1-01'){
      if(/tham so|\bm\b/.test(txt))return '2D1?1-3';
      if(/bang bien thien|do thi/.test(txt))return '2D1?1-2';
      return '2D1?1-1';
    }
    if(q.lessonId==='F1-02'){
      if(/tham so|\bm\b/.test(txt))return '2D1?2-3';
      if(/bang bien thien|do thi/.test(txt))return '2D1?2-2';
      return '2D1?2-1';
    }
    if(q.lessonId==='F1-03')return /thuc te|toi uu/.test(txt)?'2D1?3-6':(/khoang/.test(txt)?'2D1?3-2':'2D1?3-1');
    if(q.lessonId==='F1-04')return /tham so|\bm\b/.test(txt)?'2D1?4-2':'2D1?4-1';
    if(q.lessonId==='F1-05'){
      if(/tiep tuyen/.test(txt))return '2D1?5-6';
      if(/dao ham|f'|f prime/.test(txt))return '2D1?5-5';
      if(/giao diem|so nghiem/.test(txt))return '2D1?5-3';
      if(/tam doi xung|diem dac biet/.test(txt))return '2D1?5-7';
      return '2D1?5-1';
    }
    return '';
  }
  function normalizeQuestion(q={},force=false){
    const pattern=inferPattern(q);if(!pattern)return {...q,id6Status:q.id6Status||'review'};
    const f=formByPattern(pattern),id6=buildId6(pattern,q.level);
    const base={...q,formId:pattern,id6Pattern:pattern,id6,id6Title:f?.title||q.id6Title||q.form||'',form:f?.title||q.form||'',id6Status:id6?'complete':'review',id6Schema:1,id6Build:BUILD};
    // : after the sync layer is loaded, every import/editor save also receives
    // the canonical Chapter-1 lessonId + knowledgeCode derived from official ID6.
    return window.v3821Taxonomy?.canonicalizeQuestion?window.v3821Taxonomy.canonicalizeQuestion(base):base;
  }
  function analyze(bank){
    const rows=Array.isArray(bank)?bank:[],complete=rows.filter(q=>isId6(q.id6)).length,review=rows.length-complete;
    const coverage=Object.fromEntries(allForms().map(f=>[f.id6Pattern,0]));rows.forEach(q=>{const p=inferPattern(q);if(p in coverage)coverage[p]++});
    return {total:rows.length,complete,review,forms:allForms().length,covered:Object.values(coverage).filter(Boolean).length,coverage};
  }
  function normalizeBank(bank){return (Array.isArray(bank)?bank:[]).map(q=>normalizeQuestion(q))}

  // Inject official question-form taxonomies.  aligns Chapter 1 lesson IDs one-to-one with official ID6 lessons; total 19 app lessons and 57 mastery units remain unchanged.
  try{
    Object.entries(BY_APP_LESSON).forEach(([lessonId,forms])=>{
      if(typeof lessonCurriculum!=='undefined'&&lessonCurriculum[lessonId])lessonCurriculum[lessonId].forms=forms.map(x=>({...x}));
    });
  }catch(err){console.warn('ID6  taxonomy injection failed',err)}

  window.ID6V374={BUILD,LEVEL_LETTER,LEVEL_LABEL,BY_APP_LESSON,ALIASES,allForms,levelLetter,buildId6,isPattern,isId6,formByPattern,inferPattern,normalizeQuestion,normalizeBank,analyze,norm};
})();

;

/* ===== assets/js/lesson-content-v37.7.js ===== */
/* =========================================================
   Math12 Hub  — Lesson Content Engine + Taxonomy Sync
   - Align Chapter 1 to official ID6 lessons.
   - Upgrade lesson list/detail UI without changing bank/exam storage.
   ========================================================= */
(function(){
  'use strict';
  const BUILD='37.7-lesson-content-engine';

  const chapter1=chapters.find(c=>Number(c.id)===1);
  if(chapter1){
    chapter1.desc='5 bài chính thức theo GDPT 2018 và ID6: đơn điệu → cực trị → GTLN/GTNN → tiệm cận → khảo sát sự biến thiên và vẽ đồ thị.';
    chapter1.lessons=[
      {id:'F1-01',common:'Sự đồng biến và nghịch biến của hàm số'},
      {id:'F1-02',common:'Cực trị của hàm số'},
      {id:'F1-03',common:'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số'},
      {id:'F1-04',common:'Đường tiệm cận'},
      {id:'F1-05',common:'Khảo sát sự biến thiên và vẽ đồ thị hàm số'}
    ];
  }

  const curriculum={
    'F1-01':{
      minutes:50,officialLesson:1,id6Stem:'2D1?1-*',
      overview:'Học sinh dùng dấu của đạo hàm để mô tả chiều biến thiên của hàm số, đọc được tính đơn điệu từ bảng biến thiên/đồ thị và xử lí các bài toán tham số hoặc ứng dụng.',
      prerequisites:['Quy tắc tính đạo hàm','Giải phương trình và bất phương trình cơ bản','Bảng xét dấu'],
      goals:[
        'Nhận biết và phát biểu đúng mối liên hệ giữa dấu của $f\'(x)$ và tính đồng biến, nghịch biến.',
        'Xác định khoảng đồng biến, nghịch biến từ công thức, bảng biến thiên hoặc đồ thị.',
        'Xử lí bài toán tham số và bài toán thực tế có sử dụng tính đơn điệu.'
      ],
      knowledge:[
        {code:'F1-01.K1',title:'Dấu đạo hàm và chiều biến thiên',level:'NB',summary:'Trên một khoảng, nếu $f\'(x)>0$ thì $f$ đồng biến; nếu $f\'(x)<0$ thì $f$ nghịch biến. Khi kết luận cần ghi đúng từng khoảng thuộc tập xác định.'},
        {code:'F1-01.K2',title:'Đọc tính đơn điệu từ BBT và đồ thị',level:'TH',summary:'Từ bảng biến thiên đọc chiều mũi tên; từ đồ thị đọc chiều đi lên/đi xuống khi $x$ tăng. Không gộp hai khoảng rời nhau thành một khoảng.'},
        {code:'F1-01.K3',title:'Tham số và ứng dụng tính đơn điệu',level:'VD',summary:'Đưa yêu cầu “đồng biến/nghịch biến trên miền” về điều kiện dấu của $f\'$, kết hợp điều kiện xác định và các ràng buộc của tham số.'}
      ],
      keyTakeaways:['Luôn tìm tập xác định trước.','Không kết luận đồng biến trên hợp của hai khoảng rời nhau.','Với bài tham số, điều kiện dấu của đạo hàm phải đúng trên toàn miền yêu cầu.'],
      example:{problem:'Cho $f(x)=x^3-3x$. Xác định các khoảng đồng biến và nghịch biến.',solution:'$f\'(x)=3(x-1)(x+1)$. Suy ra $f\'(x)>0$ trên $(-\\infty;-1)$ và $(1;+\\infty)$, $f\'(x)<0$ trên $(-1;1)$. Vì vậy hàm số đồng biến trên $(-\\infty;-1)$, $(1;+\\infty)$ và nghịch biến trên $(-1;1)$.'},
      mistakes:['Bỏ qua tập xác định trước khi xét dấu đạo hàm.','Gộp $(-\\infty;-1)$ và $(1;+\\infty)$ thành một khoảng đồng biến.','Chỉ kiểm tra vài điểm khi bài yêu cầu điều kiện tham số trên cả khoảng.']
    },
    'F1-02':{
      minutes:50,officialLesson:2,id6Stem:'2D1?2-*',
      overview:'Từ sự đổi dấu của đạo hàm, học sinh xác định cực đại, cực tiểu; đọc cực trị từ bảng biến thiên/đồ thị và giải các bài toán tham số về cực trị.',
      prerequisites:['Bài 1: Sự đồng biến và nghịch biến','Dấu của đạo hàm','Bảng biến thiên'],
      goals:[
        'Phân biệt điểm cực trị, giá trị cực trị và tọa độ điểm cực trị.',
        'Tìm cực trị từ công thức, bảng biến thiên hoặc đồ thị.',
        'Giải bài toán tham số để hàm số có cực trị thỏa điều kiện.'
      ],
      knowledge:[
        {code:'F1-02.K1',title:'Điều kiện để có cực trị',level:'NB',summary:'Điểm $x_0$ là điểm cực trị khi hàm số đổi chiều biến thiên qua $x_0$; thường nhận biết bằng sự đổi dấu của $f\'$.'},
        {code:'F1-02.K2',title:'Cực trị từ BBT và đồ thị',level:'TH',summary:'Đạo hàm đổi dấu $+\\to-$ cho cực đại, $-\\to+$ cho cực tiểu. Cần phân biệt hoành độ cực trị với giá trị cực trị $f(x_0)$.'},
        {code:'F1-02.K3',title:'Bài toán tham số về cực trị',level:'VD',summary:'Quy điều kiện cực trị về nghiệm và sự đổi dấu của $f\'$; với hàm bậc ba/trùng phương cần kết hợp cấu trúc đạo hàm và điều kiện hình học của các điểm cực trị.'}
      ],
      keyTakeaways:['$f\'(x_0)=0$ chưa đủ để kết luận cực trị.','“Điểm cực đại” và “giá trị cực đại” là hai khái niệm khác nhau.','Bài tham số cần kiểm tra cả tồn tại cực trị và điều kiện kèm theo.'],
      example:{problem:'Cho $f(x)=x^3-3x$. Tìm các điểm cực trị.',solution:'$f\'(x)=3(x-1)(x+1)$. Dấu $f\'$ đổi $+\\to-$ tại $x=-1$ nên $f$ đạt cực đại $f(-1)=2$; đổi $-\\to+$ tại $x=1$ nên $f$ đạt cực tiểu $f(1)=-2$.'},
      mistakes:['Chỉ giải $f\'(x)=0$ rồi gọi mọi nghiệm là điểm cực trị.','Nhầm $x_0$ với $f(x_0)$.','Không kiểm tra điều kiện tham số làm mất bậc hoặc làm nghiệm trùng.']
    },
    'F1-03':{
      minutes:50,officialLesson:3,id6Stem:'2D1?3-*',
      overview:'Học sinh tìm GTLN, GTNN trên đoạn/khoảng, phân biệt với cực trị và mô hình hóa các bài toán tối ưu bằng đạo hàm.',
      prerequisites:['Bài 1: Đơn điệu','Bài 2: Cực trị','Giá trị hàm số tại điểm'],
      goals:[
        'Phân biệt giá trị cực trị với GTLN/GTNN trên miền đang xét.',
        'Tìm GTLN, GTNN trên đoạn, khoảng hoặc từ bảng biến thiên.',
        'Giải bài toán tối ưu thực tế sau khi xác định đúng biến và miền.'
      ],
      knowledge:[
        {code:'F1-03.K1',title:'GTLN, GTNN trên đoạn',level:'NB',summary:'Với hàm liên tục trên $[a;b]$, tính $f$ tại hai đầu mút và các điểm tới hạn trong đoạn rồi so sánh để tìm GTLN, GTNN.'},
        {code:'F1-03.K2',title:'GTLN, GTNN trên khoảng và miền',level:'TH',summary:'Trên khoảng hoặc miền không đóng, cần dùng bảng biến thiên/giới hạn để xét giá trị có thực sự đạt được hay chỉ là cận.'},
        {code:'F1-03.K3',title:'Tối ưu và ứng dụng GTLN–GTNN',level:'VD',summary:'Chọn biến, lập hàm mục tiêu một biến, xác định miền thực tế, tìm giá trị tối ưu rồi diễn giải kết quả theo đơn vị và bối cảnh.'}
      ],
      keyTakeaways:['Trên đoạn phải kiểm tra cả hai đầu mút.','Cực đại địa phương không nhất thiết là GTLN.','Bài thực tế phải có miền của biến trước khi tối ưu.'],
      example:{problem:'Tìm GTLN của $f(x)=-x^2+4x+1$ trên $[0;4]$.',solution:'$f\'(x)=-2x+4=0\\Leftrightarrow x=2$. So sánh $f(0)=1$, $f(2)=5$, $f(4)=1$. Vậy GTLN bằng $5$ tại $x=2$.'},
      mistakes:['Bỏ qua đầu mút của đoạn.','Kết luận GTLN/GTNN từ một điểm cực trị duy nhất mà không xét miền.','Nhận nghiệm tối ưu nhưng quên điều kiện thực tế hoặc đơn vị.']
    },
    'F1-04':{
      minutes:45,officialLesson:4,id6Stem:'2D1?4-*',
      overview:'Học sinh nhận biết và xác định tiệm cận đứng, ngang, xiên bằng giới hạn hoặc từ bảng biến thiên/đồ thị; xử lí bài toán tham số và ứng dụng.',
      prerequisites:['Giới hạn hàm số','Bài 1–3 của Chương 1','Phân thức và phép chia đa thức'],
      goals:[
        'Xác định đúng tiệm cận đứng, ngang và xiên.',
        'Đọc được tiệm cận từ đồ thị và bảng biến thiên.',
        'Giải bài toán tham số hoặc bài toán liên quan giữa đồ thị và các đường tiệm cận.'
      ],
      knowledge:[
        {code:'F1-04.K1',title:'Tiệm cận đứng',level:'NB',summary:'$x=a$ là tiệm cận đứng khi ít nhất một giới hạn một phía của $f(x)$ tại $a$ là vô cực. Mẫu bằng $0$ chưa đủ nếu biểu thức rút gọn được.'},
        {code:'F1-04.K2',title:'Tiệm cận ngang và tiệm cận xiên',level:'TH',summary:'$y=b$ là tiệm cận ngang nếu $f(x)\\to b$ khi $x\\to\\pm\\infty$. $y=ax+b$ ($a\\ne0$) là tiệm cận xiên nếu $f(x)-(ax+b)\\to0$.'},
        {code:'F1-04.K3',title:'Tham số và quan hệ đồ thị – tiệm cận',level:'VD',summary:'Kết hợp điều kiện tồn tại tiệm cận, vị trí giao của các tiệm cận, tâm đối xứng và dữ kiện đồ thị để suy ra tham số hoặc tính chất cần tìm.'}
      ],
      keyTakeaways:['Rút gọn phân thức trước khi kết luận tiệm cận đứng.','Tiệm cận ngang có dạng $y=b$, tiệm cận đứng có dạng $x=a$.','Một hàm có thể có tiệm cận khác nhau khi $x\\to+\\infty$ và $x\\to-\\infty$.'],
      example:{problem:'Tìm các tiệm cận của $y=\\dfrac{2x+1}{x-3}$.',solution:'Tại $x=3$, mẫu bằng $0$ và tử khác $0$, nên $x=3$ là tiệm cận đứng. Khi $x\\to\\pm\\infty$, $y\\to2$, nên $y=2$ là tiệm cận ngang.'},
      mistakes:['Cứ mẫu bằng $0$ là kết luận tiệm cận đứng.','Nhầm phương trình tiệm cận đứng và ngang.','Không xét hai phía hoặc hai hướng vô cực khi cần.']
    },
    'F1-05':{
      minutes:60,officialLesson:5,id6Stem:'2D1?5-*',
      overview:'Bài tổng hợp cuối chương: khảo sát hàm số, nhận dạng và biến đổi đồ thị, tương giao, đồ thị đạo hàm, tiếp tuyến và các điểm đặc biệt của đồ thị.',
      prerequisites:['Bài 1: Đơn điệu','Bài 2: Cực trị','Bài 3: GTLN–GTNN','Bài 4: Tiệm cận'],
      goals:[
        'Khảo sát sự biến thiên và phác họa đồ thị từ các dữ kiện đại số.',
        'Nhận dạng/khai thác đồ thị để giải phương trình, tương giao và bài toán tiếp tuyến.',
        'Xử lí các câu tổng hợp nhiều ý theo mạch kiến thức của cả Chương 1.'
      ],
      knowledge:[
        {code:'F1-05.K1',title:'Quy trình khảo sát và nhận dạng đồ thị',level:'NB',summary:'Tập xác định → đạo hàm → đơn điệu/cực trị → giới hạn/tiệm cận → giao trục/điểm đặc biệt → bảng biến thiên → đồ thị.'},
        {code:'F1-05.K2',title:'Tương giao, tiếp tuyến và điểm đặc biệt',level:'TH',summary:'Số nghiệm của phương trình gắn với số giao điểm; tiếp tuyến dùng đạo hàm; tâm đối xứng và các điểm đặc biệt được suy ra từ cấu trúc đồ thị.'},
        {code:'F1-05.K3',title:'Đồ thị đạo hàm và bài toán tổng hợp',level:'VD',summary:'Khai thác đồ thị $f\'$ để suy ra đơn điệu/cực trị của $f$, hoặc ngược lại; phối hợp nhiều kiến thức đã học để giải câu tổng hợp.'}
      ],
      keyTakeaways:['Đồ thị phải khớp đồng thời BBT, cực trị, giao trục và tiệm cận.','Số nghiệm phương trình = số giao điểm phù hợp sau khi biến đổi đúng.','Câu tổng hợp nhiều ý được xếp theo bài học muộn nhất cần học xong để giải trọn câu.'],
      example:{problem:'Cho đồ thị hàm số $y=f(x)$. Muốn biện luận số nghiệm của $f(x)=m$ cần làm gì?',solution:'Vẽ/đặt đường thẳng $y=m$. Số nghiệm thực phân biệt của phương trình bằng số giao điểm phân biệt của đường thẳng $y=m$ với đồ thị $y=f(x)$. Các mốc thay đổi số nghiệm thường là tung độ các điểm cực trị hoặc giá trị đặc biệt của đồ thị.'},
      mistakes:['Nhận dạng đồ thị chỉ từ một đặc điểm rồi bỏ qua các dữ kiện còn lại.','Đếm giao điểm khi chưa đưa phương trình về đúng dạng đồ thị.','Phân loại câu tổng hợp theo ý đầu tiên thay vì mốc kiến thức cuối cần dùng.']
    }
  };

  Object.entries(curriculum).forEach(([id,data])=>{
    const current=lessonCurriculum[id]||{};
    lessonCurriculum[id]={...current,...data};
  });

  // Re-inject official forms after taxonomy .
  if(window.ID6V374?.BY_APP_LESSON){
    Object.keys(curriculum).forEach(id=>{
      const forms=window.ID6V374.BY_APP_LESSON[id]||[];
      lessonCurriculum[id].forms=forms.map(f=>({...f,tip:v377TipForForm(f.id6Pattern,f.title)}));
    });
  }

  function v377PatternOf(q={}){
    if(q.id6Pattern)return String(q.id6Pattern);
    if(q.formId&&String(q.formId).includes('?'))return String(q.formId);
    const id6=String(q.id6||'');
    if(/^2[DH]\d[NHVC]\d+-\d+$/.test(id6))return id6.replace(/^(.{3})[NHVC](.+)$/,'$1?$2');
    return '';
  }
  function v377SourceBank(){return window.V383PracticeBank?.effectiveBank?.()||window.V3822PracticeBank?.effectiveBank?.({approvedOnly:false})||(state.questionBank||[])}
  function v377LessonBank(id){
    // : do not trust stale lessonId from pre-ID6 banks. The official ID6 pattern
    // is authoritative for Chapter 1, so lesson cards/counts stay correct even before
    // a persisted migration finishes (for example during a Firebase hydrate race).
    return v377SourceBank().filter(q=>{
      if(!q||!['mcq','tf','tf4','short'].includes(q.type))return false;
      const pattern=v377PatternOf(q),canonical=window.v3821Taxonomy?.lessonFromPattern?.(pattern)||'';
      return (canonical||q.lessonId)===id;
    });
  }
  function v377FormBank(pattern,id){
    return v377LessonBank(id).filter(q=>v377PatternOf(q)===pattern);
  }
  function v377LevelStats(rows=[]){
    const x={NB:0,TH:0,VD:0,VDC:0};rows.forEach(q=>{if(x[q.level]!=null)x[q.level]++});return x;
  }
  function v377TypeStats(rows=[]){
    const x={mcq:0,tf:0,tf4:0,short:0};rows.forEach(q=>{if(x[q.type]!=null)x[q.type]++});return x;
  }
  function v377TipForForm(pattern,title=''){
    const map={
      '2D1?1-1':'Tính $f\'$, giải $f\'=0$ (nếu cần), lập bảng xét dấu rồi kết luận trên từng khoảng.',
      '2D1?1-2':'Đọc đúng chiều biến thiên trên BBT/đồ thị; chú ý tập xác định và các khoảng bị ngắt.',
      '2D1?1-3':'Chuyển yêu cầu đơn điệu thành điều kiện dấu của $f\'$ trên toàn miền.',
      '2D1?1-4':'Dùng tính đơn điệu để so sánh giá trị hoặc chứng minh phương trình có nhiều nhất/một nghiệm.',
      '2D1?1-5':'Lập đại lượng theo thời gian/biến thực tế rồi xét dấu đạo hàm trong miền có nghĩa.',
      '2D1?2-1':'Tìm điểm mà đạo hàm đổi dấu; sau đó tính giá trị hàm tại điểm cực trị.',
      '2D1?2-2':'Đọc trực tiếp chiều biến thiên và tung độ/hoành độ cực trị từ BBT hoặc đồ thị.',
      '2D1?2-3':'Dùng $f\'(x_0)=0$ và điều kiện đổi dấu/điều kiện đủ để suy tham số.',
      '2D1?2-4':'Khai thác đạo hàm bậc hai của hàm bậc ba và điều kiện hai nghiệm phân biệt.',
      '2D1?2-5':'Đặt $t=x^2$ hoặc khai thác tính chẵn; chú ý cực trị tại $x=0$.',
      '2D1?2-6':'Quy bài toán về số nghiệm và dấu của đạo hàm trong từng miền xác định.',
      '2D1?2-7':'Lập hàm mục tiêu rồi dùng cực trị, kiểm tra điều kiện thực tế.',
      '2D1?3-1':'Tính tại đầu mút và mọi điểm tới hạn thuộc đoạn rồi so sánh.',
      '2D1?3-2':'Dùng BBT/giới hạn để kiểm tra giá trị có đạt được trên khoảng hay không.',
      '2D1?3-3':'Đưa biểu thức về dạng có thể đánh giá bằng bất đẳng thức hoặc miền giá trị.',
      '2D1?3-4':'Xác định miền giá trị của hàm để xét điều kiện có nghiệm của phương trình/BPT.',
      '2D1?3-5':'Cố định một biến hoặc biến đổi để giảm số biến trước khi tối ưu.',
      '2D1?3-6':'Mô hình hóa → miền biến → hàm mục tiêu → đạo hàm → trả lời theo đơn vị.',
      '2D1?4-1':'Xét giới hạn tại điểm làm mẫu bằng 0 và ở vô cực; rút gọn trước khi kết luận.',
      '2D1?4-2':'Tìm điều kiện tham số để giới hạn vô cực/hữu hạn tạo đúng loại tiệm cận.',
      '2D1?4-3':'Khai thác giao điểm các tiệm cận, tâm đối xứng và vị trí tương đối với đồ thị.',
      '2D1?4-4':'Dịch ý nghĩa tiệm cận về xu thế dài hạn của đại lượng thực tế.',
      '2D1?5-1':'So khớp đồng thời bậc/hệ số, giao trục, cực trị, tiệm cận và chiều biến thiên.',
      '2D1?5-2':'Theo dõi ảnh hưởng của tịnh tiến, đối xứng, trị tuyệt đối hoặc biến đổi đối số.',
      '2D1?5-3':'Đưa về $f(x)=m$ hoặc hai đồ thị; đếm giao điểm theo các mốc cực trị.',
      '2D1?5-4':'Giải hệ điều kiện giao điểm hoặc dùng hiệu hai hàm để xét số/ tọa độ giao điểm.',
      '2D1?5-5':'Dấu của $f\'$ cho chiều biến thiên của $f$; nghiệm đổi dấu của $f\'$ cho cực trị.',
      '2D1?5-6':'Dùng $y=f(x_0)+f\'(x_0)(x-x_0)$; nếu chưa biết $x_0$ cần lập thêm điều kiện.',
      '2D1?5-7':'Tâm đối xứng thường gắn với điểm uốn hoặc giao các tiệm cận; kiểm tra đúng loại hàm.',
      '2D1?5-8':'Kết hợp toàn bộ quy trình khảo sát với điều kiện và đơn vị của bối cảnh thực tế.'
    };
    return map[pattern]||`Xác định dữ kiện đặc trưng của dạng “${title}”, chọn công cụ đạo hàm/đồ thị phù hợp và kiểm tra điều kiện.`;
  }

  function v377LessonOrdinal(id){
    const item=getLesson(id);if(!item)return {index:0,total:0,prev:null,next:null};
    const arr=item.chapter.lessons,idx=arr.findIndex(x=>x.id===id);
    return {index:idx+1,total:arr.length,prev:idx>0?arr[idx-1]:null,next:idx>=0&&idx<arr.length-1?arr[idx+1]:null};
  }
  function v377EscapeAttr(s=''){return String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
  function v377FormMeta(f,id){
    const rows=v377FormBank(f.id6Pattern||f.id||'',id),lv=v377LevelStats(rows),types=v377TypeStats(rows);
    return {rows,lv,types,total:rows.length};
  }
  function v377BankSummary(id){
    const rows=v377LessonBank(id),lv=v377LevelStats(rows),types=v377TypeStats(rows);
    return {rows,lv,types,total:rows.length};
  }

  function v377PracticeForm(pattern,lessonId,title=''){
    const rows=v377FormBank(pattern,lessonId);
    if(!rows.length)return alert('Dạng này chưa có câu hỏi trong ngân hàng hiện tại.');
    const count=Math.min(10,rows.length),seed=(Date.now()>>>0),pick=(typeof examShuffle==='function'?examShuffle(rows,seed):rows.slice()).slice(0,count).map(q=>typeof normalizeBankQuestion==='function'?normalizeBankQuestion(q,'Luyện theo dạng ID6'):JSON.parse(JSON.stringify(q)));
    const cfg={id:`v377-form-${pattern.replace(/[^A-Za-z0-9]/g,'-')}-${new Date().toISOString().slice(0,10)}`,mode:'practice',title:`Luyện dạng • ${title||pattern}`,subtitle:`${pattern} • ${count} câu lấy trực tiếp từ ngân hàng`,durationMinutes:Math.max(10,count*2),questions:pick,scoring:'normalized',attemptType:`form-${pattern}`,rules:'Luyện đúng một dạng ID6. Đáp án được tự lưu trong quá trình làm bài.'};
    if(typeof openExamStart==='function')openExamStart(cfg);else alert('Mô-đun phòng thi chưa sẵn sàng.');
  }
  window.v377PracticeForm=v377PracticeForm;

  renderLessons=function(){
    renderChapterTabs();
    const c=chapters.find(x=>x.id===activeChapter)||chapters[0];
    const q=(document.getElementById('lessonSearch')?.value||'').toLowerCase();
    const chapterBank=v377SourceBank().filter(x=>Number(x.chapterId)===Number(c.id)).length;
    const official=c.id===1?'<span class="v377-official-chip">✓ 5 bài chính thức ID6</span>':'';
    const allPractice=v377SourceBank(),firstPracticeChapter=chapters.find(ch=>allPractice.some(q=>Number(q.chapterId)===Number(ch.id)||(ch.lessons||[]).some(l=>l.id===q.lessonId)));
    const emptyPracticeNotice=!chapterBank&&allPractice.length?`<div class="notice" style="margin-top:12px"><b>Chương ${c.id} hiện chưa có câu luyện tập trong gói dữ liệu này.</b> Ngân hàng tự học đang có <b>${allPractice.length} câu</b>${firstPracticeChapter?` ở Chương ${firstPracticeChapter.id}`:''}.${firstPracticeChapter&&firstPracticeChapter.id!==c.id?` <button class="btn btn-soft" style="margin-left:8px" onclick="selectChapter(${firstPracticeChapter.id})">Mở chương có câu luyện</button>`:''}</div>`:'';
    document.getElementById('lessonHeader').innerHTML=`<div class="v377-chapter-head"><div><div class="v377-kicker">NỘI DUNG BÀI HỌC• STUDENT PRACTICE HOTFIX</div><h3>Chương ${c.id}. ${esc(c.title)}</h3><p>${esc(c.desc)}</p></div><div class="v377-chapter-summary"><span><b>${c.lessons.length}</b><small>Bài học</small></span><span><b>${c.lessons.reduce((n,l)=>n+getLessonMeta(l.id).knowledge.length,0)}</b><small>Chuẩn kiến thức</small></span><span><b>${chapterBank}</b><small>Câu trong ngân hàng</small></span>${official}</div></div>${emptyPracticeNotice}`;
    const rows=c.lessons.filter(l=>{
      const m=getLessonMeta(l.id),text=[l.common,m.overview||'',...m.goals,...m.knowledge.map(k=>k.title),...m.forms.map(f=>f.title)].join(' ').toLowerCase();
      return text.includes(q);
    }).map((l,i)=>{
      const done=state.done.includes(l.id),m=getLessonMeta(l.id),mastered=(state.mastered[l.id]||[]).length,score=state.lessonScores[l.id],bs=v377BankSummary(l.id);
      const id6=m.id6Stem||`${l.id}`;
      return `<article class="v377-lesson-card ${done?'done':''}">
        <div class="v377-lesson-order"><span>${i+1}</span><small>BÀI</small></div>
        <div class="v377-lesson-body"><div class="v377-lesson-title-row"><div><span class="v377-id6-stem">${esc(id6)}</span><h4>${esc(l.common)}</h4></div><span class="v377-status ${done?'done':''}">${done?'✓ Đã hoàn thành':'Đang học'}</span></div>
        <p>${esc(m.overview||m.goals?.[0]||'')}</p>
        <div class="v377-lesson-metrics"><span><b>${m.knowledge.length}</b> kiến thức</span><span><b>${m.forms.length}</b> dạng ID6</span><span><b>${bs.total}</b> câu ngân hàng</span>${score!=null?`<span><b>${score}/10</b> điểm gần nhất</span>`:''}</div>
        <div class="v377-mini-progress"><span style="width:${done?100:Math.round(100*mastered/Math.max(1,m.knowledge.length))}%"></span></div></div>
        <div class="v377-lesson-actions"><button class="btn ${done?'btn-soft':'btn-blue'}" onclick="openLesson('${l.id}')">${done?'Ôn lại bài':'Mở nội dung'}</button>${bs.total?`<button class="btn btn-soft" onclick="openLessonQuiz('${l.id}')">Luyện ${Math.min(8,bs.total)} câu</button>`:''}</div>
      </article>`;
    }).join('');
    document.getElementById('lessonList').innerHTML=rows||'<div class="notice">Không tìm thấy bài phù hợp.</div>';
  };

  renderLessonDetail=function(){
    const item=getLesson(activeLessonId);if(!item)return;
    const m=getLessonMeta(activeLessonId),mastered=state.mastered[activeLessonId]||[],done=state.done.includes(activeLessonId),score=state.lessonScores[activeLessonId],studyPct=done?100:Math.round((mastered.length/Math.max(1,m.knowledge.length))*100),ord=v377LessonOrdinal(activeLessonId),bs=v377BankSummary(activeLessonId);
    const objectives=(m.goals||[]).map(g=>`<div class="objective-item"><span class="checkmark">✓</span><div>${mathHTML(g)}</div></div>`).join('');
    const prereq=(m.prerequisites||[]).map(x=>`<span class="v377-prereq">${mathHTML(x)}</span>`).join('');
    const takeaways=(m.keyTakeaways||[]).map(x=>`<li>${mathHTML(x)}</li>`).join('');
    const knowledge=(m.knowledge||[]).map((k,i)=>`<div class="v377-knowledge ${mastered.includes(k.code)?'mastered':''}"><div class="v377-knowledge-no">${String(i+1).padStart(2,'0')}</div><div class="v377-knowledge-main"><div class="v377-knowledge-head"><span class="knowledge-code">${esc(window.v3821Taxonomy?.labelForCode?.(k.code)?.stem||k.code)}</span><span class="level-badge ${levelClass(k.level)}">${levelName(k.level)}</span></div><h4>${esc(k.title)}</h4><div class="knowledge-summary">${mathHTML(k.summary)}</div></div><button class="btn ${mastered.includes(k.code)?'btn-soft':'btn-blue'}" onclick="toggleKnowledge('${activeLessonId}','${k.code}')">${mastered.includes(k.code)?'✓ Đã nắm':'Đánh dấu đã nắm'}</button></div>`).join('');
    const forms=(m.forms||[]).map((f,i)=>{
      const pattern=f.id6Pattern||f.id||'',fm=v377FormMeta(f,activeLessonId),levels=[['NB','NB'],['TH','TH'],['VD','VD'],['VDC','VDC']].filter(([k])=>fm.lv[k]).map(([k,n])=>`<span>${n}: ${fm.lv[k]}</span>`).join('');
      return `<details class="v377-form-card" ${i<2?'open':''}><summary><div><span class="v377-form-index">Dạng ${i+1}</span><span class="v377-form-id">${esc(pattern)}</span><h4>${esc(f.title)}</h4></div><div class="v377-form-count"><b>${fm.total}</b><small>câu</small></div></summary><div class="v377-form-content"><p><b>Cách làm:</b> ${mathHTML(f.tip||v377TipForForm(pattern,f.title))}</p><div class="v377-form-stats">${levels||'<span>Chưa có câu theo mức độ</span>'}</div><div class="v377-form-actions">${fm.total?`<button class="btn btn-blue" onclick="v377PracticeForm('${v377EscapeAttr(pattern)}','${activeLessonId}','${v377EscapeAttr(f.title)}')">Luyện dạng này</button>`:'<span class="v377-empty-form">Chưa có câu trong ngân hàng</span>'}</div></div></details>`;
    }).join('');
    const mistakes=(m.mistakes||[]).map(x=>`<div class="mistake-item"><b>!</b><span>${mathHTML(x)}</span></div>`).join('');
    const prev=ord.prev?`<button class="btn btn-soft" onclick="openLesson('${ord.prev.id}')">← ${esc(ord.prev.common)}</button>`:'';
    const next=ord.next?`<button class="btn btn-blue" onclick="openLesson('${ord.next.id}')">${esc(ord.next.common)} →</button>`:'';
    const classification=item.chapter.id===1?`<div class="v377-classification-rule"><b>Quy tắc xếp câu tổng hợp trong ngân hàng</b><p>Một câu nhiều ý được xếp vào <strong>bài học muộn nhất mà học sinh cần học xong để giải trọn câu</strong>. Ví dụ có ý đơn điệu, cực trị, GTLN–GTNN và tiệm cận thì xếp vào Bài 4; nếu có thêm tương giao/khảo sát đồ thị thì xếp Bài 5.</p></div>`:'';
    const bankBreakdown=`<div class="v377-bank-grid"><span><b>${bs.total}</b><small>Tổng câu</small></span><span><b>${bs.lv.NB||0}</b><small>Nhận biết</small></span><span><b>${bs.lv.TH||0}</b><small>Thông hiểu</small></span><span><b>${(bs.lv.VD||0)+(bs.lv.VDC||0)}</b><small>Vận dụng+</small></span><span><b>${bs.types.mcq||0}</b><small>MCQ</small></span><span><b>${bs.types.tf4||0}</b><small>Đúng/Sai 4 ý</small></span></div>`;
    document.getElementById('lessonDetail').innerHTML=`
      <div class="v377-back-row"><button class="link-btn" onclick="goPage('lessons')">← Danh sách bài học</button><div class="v377-breadcrumb">Chương ${item.chapter.id} / Bài ${ord.index} / ${activeLessonId}</div></div>
      <section class="v377-hero"><div class="v377-hero-main"><div class="v377-kicker">BÀI ${ord.index}/${ord.total} • ${esc(m.id6Stem||activeLessonId)}</div><h2>${esc(item.common)}</h2><p>${esc(m.overview||item.chapter.desc)}</p><div class="v377-prereq-row">${prereq}</div><div class="v377-hero-actions"><button class="btn btn-primary" onclick="document.getElementById('lessonKnowledge').scrollIntoView({behavior:'smooth'})">Bắt đầu học</button><button class="btn btn-ghost" onclick="openLessonQuiz('${activeLessonId}')">Kiểm tra sau bài</button></div></div><div class="v377-progress-panel"><small>Tiến độ bài học</small><strong>${studyPct}%</strong><div class="progress"><span style="width:${studyPct}%"></span></div><p>${mastered.length}/${m.knowledge.length} kiến thức đã nắm${score!=null?`${score}/10 gần nhất`:''}</p></div></section>
      ${classification}
      <div class="v377-anchor-nav"><a href="#v377Goals">Mục tiêu</a><a href="#lessonKnowledge">Kiến thức</a><a href="#v377Forms">Dạng ID6</a><a href="#v377Example">Ví dụ</a><a href="#v377Practice">Luyện tập</a><a href="#v377Mistakes">Lỗi thường gặp</a></div>
      <div class="study-layout mt"><main class="study-main">
        <section class="study-card" id="v377Goals"><div class="study-kicker">01 • MỤC TIÊU</div><h3>Sau bài này cần làm được gì?</h3><div class="objective-list">${objectives}</div>${takeaways?`<div class="v377-takeaways"><b>Ghi nhớ nhanh</b><ul>${takeaways}</ul></div>`:''}</section>
        <section class="study-card" id="lessonKnowledge"><div class="study-kicker">02 • KIẾN THỨC CỐT LÕI</div><h3>Học theo từng mã kiến thức</h3><p class="v377-section-desc">Mỗi mã kiến thức liên kết trực tiếp với câu hỏi, điểm số và Mastery. Học xong mục nào có thể đánh dấu mục đó.</p><div class="v377-knowledge-list">${knowledge}</div></section>
        <section class="study-card" id="v377Forms"><div class="study-kicker">03 • DẠNG TOÁN ID6</div><div class="v377-section-head"><div><h3>${m.forms.length} dạng cần luyện</h3><p>Hiển thị đúng mã dạng chính thức; dấu <b>?</b> được thay bằng N/H/V/C khi gắn mức độ cho từng câu.</p></div><span class="v377-id6-stem">${esc(m.id6Stem||'ID6')}</span></div><div class="v377-form-list">${forms}</div></section>
        <section class="study-card" id="v377Example"><div class="study-kicker">04 • VÍ DỤ TRỌNG TÂM</div><h3>Một ví dụ để nối lý thuyết với cách làm</h3><div class="example-box"><b>Bài toán.</b> ${mathHTML(m.example?.problem||'')}<div class="solution"><b>Lời giải định hướng.</b> ${mathHTML(m.example?.solution||'')}</div></div></section>
        <section class="study-card" id="v377Practice"><div class="study-kicker">05 • LUYỆN TẬP TỪ NGÂN HÀNG</div><div class="v377-section-head"><div><h3>Câu hỏi đang có cho bài này</h3><p>Dữ liệu lấy từ toàn bộ ngân hàng tự học hiện tại; trạng thái QC/duyệt vẫn phục vụ quản trị giáo viên nhưng không chặn học sinh tự ôn.</p></div><button class="btn btn-blue" onclick="openLessonQuiz('${activeLessonId}')" ${bs.total?'':'disabled'}>Luyện bộ nhanh</button></div>${bankBreakdown}</section>
        <section class="study-card" id="v377Mistakes"><div class="study-kicker">06 • LỖI THƯỜNG GẶP</div><h3>Những điểm dễ mất điểm</h3><div class="mistake-list">${mistakes}</div></section>
        <div class="v377-prev-next">${prev}<span></span>${next}</div>
      </main><aside class="study-aside">
        <div class="study-card v377-sticky"><div class="v377-kicker">LỘ TRÌNH GỢI Ý</div><h3>${m.minutes||50} phút</h3><div class="study-steps"><div class="study-step"><span>1</span><div><b>Đọc mục tiêu & ghi nhớ</b><small>5–8 phút</small></div></div><div class="study-step"><span>2</span><div><b>Học kiến thức cốt lõi</b><small>12–15 phút</small></div></div><div class="study-step"><span>3</span><div><b>Luyện theo dạng ID6</b><small>15–20 phút</small></div></div><div class="study-step"><span>4</span><div><b>Kiểm tra từ ngân hàng</b><small>10–15 phút</small></div></div></div><button class="btn ${done?'btn-soft':'btn-blue'} v377-full" onclick="markLessonStudied('${activeLessonId}')">${done?'✓ Đã hoàn thành':'Đánh dấu đã học xong'}</button></div>
        <div class="study-card"><h3>Ngân hàng bài này</h3>${bankBreakdown}</div>
        <div class="study-card"><h3>Kết quả gần nhất</h3>${score!=null?`<div class="lesson-score">${score}/10</div><small style="color:var(--muted)">Điểm kiểm tra sau bài</small>`:'<div class="v377-muted">Chưa có lượt kiểm tra.</div>'}</div>
      </aside></div>`;
    typesetMath(document.getElementById('lessonDetail'));
  };

  document.documentElement.dataset.lessonContentBuild=BUILD;
  window.v377LessonContent={BUILD,curriculum,lessonBank:v377LessonBank,patternOf:v377PatternOf,tipForForm:v377TipForForm};
})();

;

/* ===== assets/js/taxonomy-sync-v38.2.1.js ===== */
/* =========================================================
   Math12 Hub  — Chapter 1 Taxonomy Sync
   Goal: one canonical Chapter-1 structure everywhere:
   Bài 1 Đơn điệu → Bài 2 Cực trị → Bài 3 GTLN/GTNN
   → Bài 4 Tiệm cận → Bài 5 Khảo sát đồ thị.
   Internal F1-xx.Kx codes remain storage keys, but student-facing
   labels prefer official lesson/form names and ID6 patterns.
   ========================================================= */
(function(){
'use strict';
const BUILD='38.2.1-taxonomy-sync', SCHEMA=3821;
const LESSONS={
 'F1-01':{n:1,title:'Sự đồng biến và nghịch biến của hàm số',stem:'2D1?1-*'},
 'F1-02':{n:2,title:'Cực trị của hàm số',stem:'2D1?2-*'},
 'F1-03':{n:3,title:'Giá trị lớn nhất và giá trị nhỏ nhất của hàm số',stem:'2D1?3-*'},
 'F1-04':{n:4,title:'Đường tiệm cận',stem:'2D1?4-*'},
 'F1-05':{n:5,title:'Khảo sát sự biến thiên và vẽ đồ thị hàm số',stem:'2D1?5-*'}
};
const FORM_K={
 '2D1?1-1':'F1-01.K1','2D1?1-2':'F1-01.K2','2D1?1-3':'F1-01.K3','2D1?1-4':'F1-01.K3','2D1?1-5':'F1-01.K3',
 '2D1?2-1':'F1-02.K1','2D1?2-2':'F1-02.K2','2D1?2-3':'F1-02.K3','2D1?2-4':'F1-02.K3','2D1?2-5':'F1-02.K3','2D1?2-6':'F1-02.K3','2D1?2-7':'F1-02.K3',
 '2D1?3-1':'F1-03.K1','2D1?3-2':'F1-03.K2','2D1?3-3':'F1-03.K3','2D1?3-4':'F1-03.K3','2D1?3-5':'F1-03.K3','2D1?3-6':'F1-03.K3',
 '2D1?4-1':'F1-04.K2','2D1?4-2':'F1-04.K3','2D1?4-3':'F1-04.K3','2D1?4-4':'F1-04.K3',
 '2D1?5-1':'F1-05.K1','2D1?5-2':'F1-05.K1','2D1?5-3':'F1-05.K2','2D1?5-4':'F1-05.K2','2D1?5-5':'F1-05.K3','2D1?5-6':'F1-05.K2','2D1?5-7':'F1-05.K2','2D1?5-8':'F1-05.K3'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
function patternOf(q={}){return window.ID6V374?.inferPattern?.(q)||''}
function lessonFromPattern(p=''){
 const m=String(p).match(/^2D1\?([1-5])-/);return m?`F1-0${m[1]}`:'';
}
function textOf(q={}){return norm(`${q.question||''} ${q.form||''} ${q.formTitle||''} ${q.id6Title||''}`)}
function knowledgeFor(q={},p=patternOf(q),lessonId=lessonFromPattern(p)){
 if(!lessonId)return q.knowledgeCode||'';
 const txt=textOf(q);
 if(lessonId==='F1-04'&&p==='2D1?4-1'){
   if(/tiem can dung|tcđ|tcd/.test(txt)&&!/tiem can ngang|tiem can xien|tcn|tcx/.test(txt))return 'F1-04.K1';
   if(/tiem can ngang|tiem can xien|tcn|tcx/.test(txt))return 'F1-04.K2';
 }
 return FORM_K[p]||`${lessonId}.K1`;
}
function knowledgeMeta(code=''){
 const lid=String(code).split('.K')[0],arr=typeof getLessonMeta==='function'?(getLessonMeta(lid)?.knowledge||[]):[];
 return arr.find(k=>k.code===code)||null;
}
function formMeta(p=''){return window.ID6V374?.formByPattern?.(p)||null}
function buildId6(p='',level=''){return window.ID6V374?.buildId6?.(p,level)||''}
function canonicalizeQuestion(q={}){
 const p=patternOf(q);if(!/^2D1\?[1-5]-/.test(p))return q;
 const lessonId=lessonFromPattern(p),lesson=LESSONS[lessonId],form=formMeta(p),knowledgeCode=knowledgeFor(q,p,lessonId),km=knowledgeMeta(knowledgeCode),level=['NB','TH','VD','VDC'].includes(q.level)?q.level:'TH',id6=buildId6(p,level)||q.id6||'';
 const out={...q,chapterId:1,lessonId,knowledgeCode,knowledgeTitle:km?.title||q.knowledgeTitle||'',formId:p,id6Pattern:p,id6,id6Lesson:lesson.n,id6Title:form?.title||q.id6Title||q.form||'',formTitle:form?.title||q.formTitle||q.form||'',form:form?.title||q.form||'',metadataStatusV36:'complete',questionBankSchema:Number(q.questionBankSchema)||36,knowledgeMapVersion:Number(q.knowledgeMapVersion)||36,curriculumId:q.curriculumId||'MATH12-GDPT2018-2026',grade:12};
 out.blueprintKey=[knowledgeCode,id6||p,level,q.type||''].join('|');
 out.taxonomyPath=`C1 > ${lessonId} > ${knowledgeCode} > ${p}`;
 return out;
}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function syncHistory(bankMap){
 let changed=0;for(const h of state.questionHistory||[]){const q=bankMap.get(h.questionId);if(!q)continue;const before=`${h.lessonId}|${h.knowledgeCode}|${h.code}`;h.chapterId=q.chapterId;h.lessonId=q.lessonId;h.knowledgeCode=q.knowledgeCode;h.code=q.knowledgeCode;h.level=q.level||h.level;const after=`${h.lessonId}|${h.knowledgeCode}|${h.code}`;if(before!==after)changed++}return changed;
}
function syncAttempts(bankMap){
 let changed=0;for(const a of state.examAttempts||[]){for(const r of a.questionResults||[]){const q=bankMap.get(r.questionId);if(!q)continue;const before=`${r.lessonId}|${r.knowledgeCode}`;r.chapterId=q.chapterId;r.lessonId=q.lessonId;r.knowledgeCode=q.knowledgeCode;r.level=q.level||r.level;if(before!==`${r.lessonId}|${r.knowledgeCode}`)changed++}}return changed;
}
function syncState(opts={}){
 if(typeof state==='undefined'||!state)return {changed:0,questions:0,history:0,attempts:0};
 let qChanged=0;state.questionBank=Array.isArray(state.questionBank)?state.questionBank:state.questionBank;
 if(Array.isArray(state.questionBank))state.questionBank=state.questionBank.map(q=>{const n=canonicalizeQuestion(q);if(n!==q&&!same(n,q))qChanged++;return n});
 const bankMap=new Map((state.questionBank||[]).map(q=>[q.id,q])),history=syncHistory(bankMap),attempts=syncAttempts(bankMap),changed=qChanged+history+attempts;
 state._meta=state._meta||{};state._meta.f1TaxonomyVersion=SCHEMA;state._meta.f1TaxonomyBuild=BUILD;state._meta.f1TaxonomySyncedAt=new Date().toISOString();state._meta.f1TaxonomyLastChanged=changed;
 if(changed&&opts.persist!==false&&typeof save==='function')save({reason:'v38.2.1-taxonomy-sync',sync:opts.sync!==false});
 return {changed,questions:qChanged,history,attempts};
}
function labelForCode(code=''){
 const k=knowledgeMeta(code),lid=k?.code?.split('.K')[0]||String(code).split('.K')[0],l=LESSONS[lid]||null;
 if(!l)return {code,title:k?.title||code,lessonId:lid,lessonTitle:typeof getLesson==='function'?(getLesson(lid)?.common||lid):lid,stem:''};
 return {code,title:k?.title||code,lessonId:lid,lessonTitle:l.title,stem:l.stem,lessonNo:l.n};
}
function humanCode(code='',short=false){const x=labelForCode(code);return short?`${x.stem||x.lessonId} • ${x.title}`:`Bài ${x.lessonNo||''} • ${x.lessonTitle}${x.title&&x.title!==x.lessonTitle?`${x.title}`:''}`}
function formPath(q={}){const p=patternOf(q),f=formMeta(p),lid=lessonFromPattern(p),l=LESSONS[lid];return {pattern:p,formTitle:f?.title||q.formTitle||q.form||'',lessonId:lid,lessonTitle:l?.title||'',lessonNo:l?.n||0}}
function patchForms(){
 for(const [lid,meta] of Object.entries(LESSONS)){
   const lesson=chapters?.[0]?.lessons?.find(x=>x.id===lid);if(lesson)lesson.common=meta.title;
   const forms=window.ID6V374?.BY_APP_LESSON?.[lid]||[];
   forms.forEach(f=>{f.knowledgeCode=FORM_K[f.id6Pattern]||f.knowledgeCode||`${lid}.K1`});
   if(typeof lessonCurriculum!=='undefined'&&lessonCurriculum[lid])lessonCurriculum[lid].forms=forms.map(f=>({...f,knowledgeCode:f.knowledgeCode}));
 }
}
function installFirebasePostHydrate(){
 // Firebase may already be loaded by the time this poll runs. Wrapping is useful for later sign-in/account switches.
 if(typeof window.firebaseHydrateUser==='function'&&!window.firebaseHydrateUser.__v3821){const base=window.firebaseHydrateUser;const w=async function(u){const r=await base(u);syncState({persist:true,sync:false});try{renderAll?.()}catch(_){}return r};w.__v3821=true;window.firebaseHydrateUser=w;return true}return false;
}
patchForms();
const initial=syncState({persist:true,sync:false});
window.v3821Taxonomy={build:BUILD,schema:SCHEMA,lessons:LESSONS,formKnowledge:FORM_K,patternOf,lessonFromPattern,knowledgeFor,canonicalizeQuestion,syncState,labelForCode,humanCode,formPath,initial};
document.documentElement.dataset.taxonomySyncBuild=BUILD;
let tries=0,timer=setInterval(()=>{tries++;if(installFirebasePostHydrate()||tries>30)clearInterval(timer)},150);
setTimeout(()=>syncState({persist:true,sync:false}),1200);
setTimeout(()=>syncState({persist:true,sync:false}),3500);
})();

;
