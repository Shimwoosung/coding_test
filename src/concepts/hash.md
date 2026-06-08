# 해시 (map / set)

## 한 줄 요약
"있냐/없냐", "이 키의 값" 조회를 평균 O(1)에. 카운팅·중복제거·매핑의 기본 도구.

## 언제 쓰나
- 멤버십 조회, 빈도 세기, 두 집합 교집합
- 이름↔번호 매핑, 방문 기록

## 왜 이거 + 대안 + 차이
- unordered_map/set: 평균 O(1), 순서 없음. map/set: O(log N), 정렬된 순서 유지.
- 정렬 순서가 필요하거나 최악 성능이 중요하면 map/set, 단순 조회 빠르게면 unordered_*.
- 값 범위가 작으면 그냥 배열이 가장 빠름.

## 핵심
- `unordered_set<int> s; s.count(x); s.insert(x);`
- `unordered_map<string,int> m; m[key]++;`
- 큰 입력은 reserve로 리해시 줄이기.

## 흔한 실수
- map의 operator[]는 없는 키를 0/기본값으로 "생성"함 → 의도치 않은 삽입
- 출력 정렬이 필요한데 unordered_* 사용
