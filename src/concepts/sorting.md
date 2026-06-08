# 정렬 (Sorting)

## 한 줄 요약
std::sort는 O(N log N). "무엇을 기준으로 정렬하느냐"가 문제의 핵심인 경우가 많다.

## 언제 쓰나
- 단순 정렬, 좌표/문자열 다중 기준 정렬
- 좌표 압축(정렬+중복제거+lower_bound), 그리디의 전처리

## 왜 이거 + 대안 + 차이
- sort는 불안정(같은 값 순서 보장 X). 입력 순서 유지가 필요하면 stable_sort.
- 비교 함수(람다)로 다중 기준: 1순위 같으면 2순위.

## 핵심
- `sort(v.begin(), v.end(), cmp);`
- 좌표 압축: 정렬 → unique/erase → lower_bound로 순위.
- 큰 입력은 scanf/printf 또는 sync_with_stdio(false).

## 흔한 실수
- 비교 함수에서 같을 때 true 반환 → strict weak ordering 위반(런타임 에러)
- 안정성 필요한데 sort 사용
