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
      summary: "학교 소개와 교육 관련 기본 안내를 모으는 주제입니다.",
      overview: "학교 소개, 교육과정, 문의 안내처럼 기본적으로 알아두면 좋은 정보를 정리하는 가지입니다.",
      sourceUrl: "",
      updatedAt: "",
      topics: [
        { id: "school-intro", title: "학교 소개", summary: "학교의 공식 소개와 기본 정보를 확인해요.", guidance: "학교 홈페이지에 공개된 학교 소개 자료를 확인해 요약하고, 원문 링크를 덧붙여 주세요." },
        { id: "curriculum", title: "교육과정", summary: "교육과정과 학습 안내를 모아요.", guidance: "학교가 공개한 교육과정 안내를 기준으로 학년별 주요 내용을 정리하고, 적용 연도를 함께 적어 주세요." },
        { id: "contact", title: "문의 안내", summary: "공개된 대표 문의 정보를 정리해요.", guidance: "학교 홈페이지에 공개된 대표 연락처와 문의 경로를 확인해 입력해 주세요. 개인 연락처는 등록하지 마세요." }
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
        { id: "year-calendar", title: "학사일정", summary: "연간 학사 일정을 확인해요.", guidance: "학교가 공개한 해당 학년도 학사일정을 기준으로 날짜와 변경 사항을 기록하고, 원문 링크를 덧붙여 주세요." },
        { id: "events", title: "행사 안내", summary: "교내 행사와 참여 방법을 모아요.", guidance: "학교에서 공지한 행사명, 일정, 대상, 참여 방법을 확인된 내용만 입력해 주세요." },
        { id: "assessment", title: "시험·평가", summary: "시험과 평가 관련 공지를 모아요.", guidance: "학교의 공식 공지에서 확인한 평가 일정과 안내 사항을 적용 학년·학기와 함께 정리해 주세요." }
      ]
    },
    {
      id: "activities",
      number: "03",
      title: "동아리·학생 참여",
      subtitle: "학생 활동",
      summary: "동아리와 학생 참여 활동 정보를 모으는 주제입니다.",
      overview: "동아리 활동과 학생 자치·참여 방법을 소개하는 정보를 정리하는 가지입니다.",
      sourceUrl: "",
      updatedAt: "",
      topics: [
        { id: "clubs", title: "동아리 안내", summary: "동아리 소개와 가입 안내를 확인해요.", guidance: "학교에서 확인한 동아리 목록과 모집 공지를 바탕으로 활동 분야, 모집 시기, 신청 방법을 정리해 주세요." },
        { id: "student-council", title: "학생 참여", summary: "학생회와 자치 활동 안내를 모아요.", guidance: "학교가 공개한 학생회·자치 활동의 역할과 참여 방법을 확인해 정리해 주세요." },
        { id: "join-activities", title: "참여 방법", summary: "활동에 참여하는 경로를 안내해요.", guidance: "신청 기간, 신청 경로, 담당 부서 등 공개된 참여 정보를 최신 공지와 함께 입력해 주세요." }
      ]
    },
    {
      id: "facilities",
      number: "04",
      title: "교내 시설",
      subtitle: "공간과 이용 안내",
      summary: "교내 주요 공간과 이용 안내를 모으는 주제입니다.",
      overview: "도서관과 공용 공간 등 학생들이 자주 찾는 시설의 위치·운영·이용 정보를 정리하는 가지입니다.",
      sourceUrl: "",
      updatedAt: "",
      topics: [
        { id: "library", title: "도서관", summary: "도서관 이용 안내를 확인해요.", guidance: "학교가 공개한 도서관 위치, 이용 시간, 대출 안내를 확인해 입력해 주세요." },
        { id: "shared-spaces", title: "공용 공간", summary: "급식실과 체육 공간 안내를 모아요.", guidance: "공식 자료에서 확인한 시설 위치와 이용 안내를 공간별로 정리해 주세요." },
        { id: "student-support", title: "학생 지원 공간", summary: "학생 지원 공간의 이용 안내를 모아요.", guidance: "학교가 공개한 학생 지원 공간의 위치와 이용 방법을 확인해 입력해 주세요." }
      ]
    }
  ]
};
