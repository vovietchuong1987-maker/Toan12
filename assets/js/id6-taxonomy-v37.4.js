/* =========================================================
   Math12 Hub V37.4 — Official ID6 Taxonomy
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

    // V37.7: Chương 1 được căn thẳng với 5 bài chính thức.
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

  // Strong aliases from the former V36 form names → official ID6 patterns.
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
    // V38.2.1: after the sync layer is loaded, every import/editor save also receives
    // the canonical Chapter-1 lessonId + knowledgeCode derived from official ID6.
    return window.v3821Taxonomy?.canonicalizeQuestion?window.v3821Taxonomy.canonicalizeQuestion(base):base;
  }
  function analyze(bank){
    const rows=Array.isArray(bank)?bank:[],complete=rows.filter(q=>isId6(q.id6)).length,review=rows.length-complete;
    const coverage=Object.fromEntries(allForms().map(f=>[f.id6Pattern,0]));rows.forEach(q=>{const p=inferPattern(q);if(p in coverage)coverage[p]++});
    return {total:rows.length,complete,review,forms:allForms().length,covered:Object.values(coverage).filter(Boolean).length,coverage};
  }
  function normalizeBank(bank){return (Array.isArray(bank)?bank:[]).map(q=>normalizeQuestion(q))}

  // Inject official question-form taxonomies. V37.7 aligns Chapter 1 lesson IDs one-to-one with official ID6 lessons; total 19 app lessons and 57 mastery units remain unchanged.
  try{
    Object.entries(BY_APP_LESSON).forEach(([lessonId,forms])=>{
      if(typeof lessonCurriculum!=='undefined'&&lessonCurriculum[lessonId])lessonCurriculum[lessonId].forms=forms.map(x=>({...x}));
    });
  }catch(err){console.warn('ID6 V37.4 taxonomy injection failed',err)}

  window.ID6V374={BUILD,LEVEL_LETTER,LEVEL_LABEL,BY_APP_LESSON,ALIASES,allForms,levelLetter,buildId6,isPattern,isId6,formByPattern,inferPattern,normalizeQuestion,normalizeBank,analyze,norm};
})();
