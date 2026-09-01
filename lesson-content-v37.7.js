/* =========================================================
   Math12 Hub V38.2.1 — Lesson Content Engine + Taxonomy Sync
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

  // Re-inject official forms after taxonomy V37.4.
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
  function v377SourceBank(){return window.V3822PracticeBank?.effectiveBank?.()||(state.questionBank||[])}
  function v377LessonBank(id){
    // V38.2.1: do not trust stale lessonId from pre-ID6 banks. The official ID6 pattern
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
    document.getElementById('lessonHeader').innerHTML=`<div class="v377-chapter-head"><div><div class="v377-kicker">NỘI DUNG BÀI HỌC • V38.2.2 • PUBLISHED BANK + ID6</div><h3>Chương ${c.id}. ${esc(c.title)}</h3><p>${esc(c.desc)}</p></div><div class="v377-chapter-summary"><span><b>${c.lessons.length}</b><small>Bài học</small></span><span><b>${c.lessons.reduce((n,l)=>n+getLessonMeta(l.id).knowledge.length,0)}</b><small>Chuẩn kiến thức</small></span><span><b>${chapterBank}</b><small>Câu trong ngân hàng</small></span>${official}</div></div>`;
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
      <section class="v377-hero"><div class="v377-hero-main"><div class="v377-kicker">BÀI ${ord.index}/${ord.total} • ${esc(m.id6Stem||activeLessonId)}</div><h2>${esc(item.common)}</h2><p>${esc(m.overview||item.chapter.desc)}</p><div class="v377-prereq-row">${prereq}</div><div class="v377-hero-actions"><button class="btn btn-primary" onclick="document.getElementById('lessonKnowledge').scrollIntoView({behavior:'smooth'})">Bắt đầu học</button><button class="btn btn-ghost" onclick="openLessonQuiz('${activeLessonId}')">Kiểm tra sau bài</button></div></div><div class="v377-progress-panel"><small>Tiến độ bài học</small><strong>${studyPct}%</strong><div class="progress"><span style="width:${studyPct}%"></span></div><p>${mastered.length}/${m.knowledge.length} kiến thức đã nắm${score!=null?` • ${score}/10 gần nhất`:''}</p></div></section>
      ${classification}
      <div class="v377-anchor-nav"><a href="#v377Goals">Mục tiêu</a><a href="#lessonKnowledge">Kiến thức</a><a href="#v377Forms">Dạng ID6</a><a href="#v377Example">Ví dụ</a><a href="#v377Practice">Luyện tập</a><a href="#v377Mistakes">Lỗi thường gặp</a></div>
      <div class="study-layout mt"><main class="study-main">
        <section class="study-card" id="v377Goals"><div class="study-kicker">01 • MỤC TIÊU</div><h3>Sau bài này cần làm được gì?</h3><div class="objective-list">${objectives}</div>${takeaways?`<div class="v377-takeaways"><b>Ghi nhớ nhanh</b><ul>${takeaways}</ul></div>`:''}</section>
        <section class="study-card" id="lessonKnowledge"><div class="study-kicker">02 • KIẾN THỨC CỐT LÕI</div><h3>Học theo từng mã kiến thức</h3><p class="v377-section-desc">Mỗi mã kiến thức liên kết trực tiếp với câu hỏi, điểm số và Mastery. Học xong mục nào có thể đánh dấu mục đó.</p><div class="v377-knowledge-list">${knowledge}</div></section>
        <section class="study-card" id="v377Forms"><div class="study-kicker">03 • DẠNG TOÁN ID6</div><div class="v377-section-head"><div><h3>${m.forms.length} dạng cần luyện</h3><p>Hiển thị đúng mã dạng chính thức; dấu <b>?</b> được thay bằng N/H/V/C khi gắn mức độ cho từng câu.</p></div><span class="v377-id6-stem">${esc(m.id6Stem||'ID6')}</span></div><div class="v377-form-list">${forms}</div></section>
        <section class="study-card" id="v377Example"><div class="study-kicker">04 • VÍ DỤ TRỌNG TÂM</div><h3>Một ví dụ để nối lý thuyết với cách làm</h3><div class="example-box"><b>Bài toán.</b> ${mathHTML(m.example?.problem||'')}<div class="solution"><b>Lời giải định hướng.</b> ${mathHTML(m.example?.solution||'')}</div></div></section>
        <section class="study-card" id="v377Practice"><div class="study-kicker">05 • LUYỆN TẬP TỪ NGÂN HÀNG</div><div class="v377-section-head"><div><h3>Câu hỏi đang có cho bài này</h3><p>Dữ liệu lấy từ ngân hàng luyện tập đã duyệt; học sinh luôn có thể dùng Published Practice Bank mà không truy cập ngân hàng riêng của giáo viên.</p></div><button class="btn btn-blue" onclick="openLessonQuiz('${activeLessonId}')" ${bs.total?'':'disabled'}>Luyện bài này</button></div>${bankBreakdown}</section>
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
