/*
 * 정보 콘텐츠 편집 파일
 * 확인된 안내를 작성할 때 summary, guidance, sourceUrl, updatedAt 값을 수정하세요.
 * 학교의 사실 정보를 입력하기 전에는 공식 자료와 출처를 확인해 주세요.
 */
window.SEOHYUN_INFO = {
  updatedAt: "등록 전",
  categories: [
    {
      id: "school",
      number: "01",
      title: "학교정보",
      subtitle: "기본 안내",
      summary: "학교 소개와 교육·교내 시설 안내를 모으는 주제입니다.",
      overview: "학교 소개, 교육과정, 문의 안내와 교내 시설 정보를 함께 확인할 수 있는 가지입니다.",
      sourceUrl: "",
      updatedAt: "",
      topics: [
        {
          id: "school-intro",
          title: "학교 소개·교장",
          summary: "학교의 공식 비전과 교장 정보를 확인해요.",
          guidance: "학교명: 서현고등학교. 공식 인사말에는 학교 비전이 ‘인격과 지성을 겸비한 글로벌 인재 양성’으로 소개되어 있습니다. 학교 홈페이지 교직원 현황에 게시된 교장은 오기석입니다. 교직원 정보는 바뀔 수 있으니 최신 현황을 원문에서 확인해 주세요.",
          sources: [
            { label: "학교 인사말", url: "https://seohyun-h.goesn.kr/seohyun-h/cm/cntnts/cntntsView.do?cntntsId=3731&mi=19645" },
            { label: "교직원 현황", url: "https://seohyun-h.goesn.kr/seohyun-h/cm/cntnts/cntntsView.do?cntntsId=3736&mi=19661" }
          ],
          updatedAt: "2026.11.09"
        },
        {
          id: "school-symbols",
          title: "교표·교화·교목",
          summary: "서현고의 공식 상징과 의미를 확인해요.",
          guidance: "교화는 장미이며 의미는 열정과 사랑입니다. 교목은 은행나무이며 의미는 협동과 봉사입니다. 교표는 노란 바탕(희망·활기), 군청색 책(이상), 흰색(순수 정신), 다이아몬드형(이상), 책과 펜(진리를 탐구해 이상을 실현하는 길잡이)으로 설명되어 있습니다. 교가는 이 학교상징 페이지에서 확인되지 않아 추가 확인이 필요합니다.",
          sourceUrl: "https://seohyun-h.goesn.kr/seohyun-h/cm/cntnts/cntntsView.do?cntntsId=3733&mi=19649",
          updatedAt: "2026.11.09"
        },
        { id: "curriculum", title: "교육과정", summary: "교육과정과 학습 안내를 모아요.", guidance: "학교가 공개한 교육과정 안내를 기준으로 학년별 주요 내용을 정리하고, 적용 연도를 함께 적어 주세요." },
        {
          id: "contact",
          title: "문의 안내",
          summary: "학교 대표 연락처를 확인해요.",
          guidance: "학교 홈페이지에 게시된 대표 연락처는 교무실 031-701-5993~6, 행정실 031-702-8485입니다. 연락처는 변경될 수 있으니 통화 전 공식 홈페이지에서 다시 확인해 주세요.",
          sourceUrl: "https://seohyun-h.goesn.kr/seohyun-h/main.do",
          updatedAt: "2026.11.09"
        }
      ],
      subcategories: [
        {
          id: "facilities",
          number: "01.05",
          title: "교내 시설",
          subtitle: "공간과 이용 안내",
          summary: "교내 주요 공간과 이용 안내를 모으는 주제입니다.",
          overview: "도서관과 공용 공간 등 학생들이 자주 찾는 시설의 위치·운영·이용 정보를 정리하는 가지입니다.",
          sourceUrl: "",
          updatedAt: "",
          topics: [
            { id: "library", title: "도서관", summary: "도서관 이용 안내를 확인해요.", guidance: "학교가 공개한 도서관 위치, 이용 시간, 대출 안내를 확인해 입력해 주세요." },
            { id: "shared-spaces", title: "공용 공간", summary: "급식실과 체육 공간 안내를 모아요.", guidance: "공식 자료에서 확인한 시설 위치와 이용 안내를 공간별로 정리해 주세요." },
            { id: "student-support", title: "학생 지원 공간", summary: "학생 지원 공간의 이용 안내를 모아요.", guidance: "학교가 공개한 학생 지원 공간의 위치와 이용 방법을 확인해 입력해 주세요." },
            {
              id: "school-map",
              title: "학교 위치·지도",
              summary: "공식 주소와 오시는 길을 확인해요.",
              guidance: "학교 주소: [13588] 경기도 성남시 분당구 분당로 87. 학교 홈페이지에 ‘오시는 길’ 페이지가 있습니다. 확인한 공식 자료에서는 교내 건물별 상세 지도나 공간별 이용 시간까지 확인되지 않아 추가하지 않았습니다.",
              sources: [
                { label: "학교 오시는 길", url: "https://seohyun-h.goesn.kr/seohyun-h/lm/location/locationMapView.do?mi=19658" },
                { label: "학교 홈페이지·대표 연락처", url: "https://seohyun-h.goesn.kr/seohyun-h/main.do" }
              ],
              updatedAt: "2026.11.09"
            }
          ]
        }
      ]
    },
    {
      id: "calendar",
      number: "02",
      title: "학사 일정",
      subtitle: "일정과 행사",
      summary: "학사 일정과 교내 행사 정보를 모으는 주제입니다.",
      overview: "연간 학사 일정과 학교에서 안내하는 행사 정보를 확인하기 쉽게 정리하는 가지입니다.",
      sourceUrl: "",
      updatedAt: "",
      topics: [
        {
          id: "year-calendar",
          title: "2026 학사일정",
          summary: "2026학년도 공식 일정과 변경 공지를 확인해요.",
          guidance: "기준 학년도: 2026학년도. 공식 학사일정 페이지에서 2026년 달력을 확인할 수 있습니다. 2026.04.10 변경 공지에는 5월 1일 노동절 공휴일, 1학기 방학식 7월 21일 변동 없음, 1학기 수업일수 96일에서 95일로 변경되었다고 안내되어 있습니다. 2026.05.22에도 고교학점제 공간조성 사업에 따른 학사일정 변경 공지가 게시되었습니다. 세부 변경 날짜는 해당 공지의 첨부 자료를 확인하고, 지난 일정은 현재 일정처럼 해석하지 마세요.",
          sources: [
            { label: "2026 학사일정 조회", url: "https://seohyun-h.goesn.kr/seohyun-h/ps/schdul/selectSchdulMainList.do?mi=19746" },
            { label: "2026.04.10 노동절 반영 공지", url: "https://seohyun-h.goesn.kr/seohyun-h/na/ntt/selectNttInfo.do?mi=19943&nttSn=1918785" },
            { label: "2026.05.22 학사일정 변경 공지", url: "https://seohyun-h.goesn.kr/seohyun-h/na/ntt/selectNttInfo.do?bbsId=15548&mi=19944&nttSn=1930099" }
          ],
          updatedAt: "2026.11.09"
        },
        { id: "events", title: "행사 안내", summary: "교내 행사와 참여 방법을 모아요.", guidance: "학교에서 공지한 행사명, 일정, 대상, 참여 방법을 확인된 내용만 입력해 주세요." },
        { id: "assessment", title: "시험·평가", summary: "시험과 평가 관련 공지를 모아요.", guidance: "학교의 공식 공지에서 확인한 평가 일정과 안내 사항을 적용 학년·학기와 함께 정리해 주세요." }
      ]
    },
    {
      id: "activities",
      number: "03",
      title: "동아리·학생 참여",
      subtitle: "학생 활동",
      summary: "동아리와 학생 참여 안내는 학생들이 작성할 예정입니다.",
      overview: "동아리와 학생 참여 안내는 학생들이 확인한 내용과 출처를 덧붙여 작성할 예정입니다.",
      sourceUrl: "",
      updatedAt: "2026.11.09",
      topics: [
        { id: "clubs", title: "동아리 안내", summary: "학생들이 동아리와 가입 정보를 작성할 예정이에요.", guidance: "동아리 목록이나 가입 시기를 임의로 채우지 않았습니다. 학생들이 확인된 활동 소개, 모집 시기, 신청 방법과 출처를 작성해 주세요." },
        { id: "student-council", title: "학생 참여", summary: "학생회와 자치 활동 안내를 모아요.", guidance: "학교가 공개한 학생회·자치 활동의 역할과 참여 방법을 확인해 정리해 주세요." },
        { id: "join-activities", title: "참여 방법", summary: "활동에 참여하는 경로를 안내해요.", guidance: "신청 기간, 신청 경로, 담당 부서 등 공개된 참여 정보를 최신 공지와 함께 입력해 주세요." }
      ]
    }
  ]
};
