# 트리 (Tree)

## 한 줄 요약
트리는 **계층(부모-자식) 관계**를 표현하는 자료구조로, 사이클이 없고 연결된 그래프(노드 N개, 간선 N-1개)이며, 하나의 루트에서 가지가 뻗어나가는 형태다.

## 언제 쓰나
- **계층 구조 표현**: 폴더/파일 시스템, 회사 조직도, 가계도, HTML DOM
- **빠른 탐색/정렬**: 이진 탐색 트리(BST), `std::set`/`std::map`의 내부(균형 트리)
- **구간 합/구간 최댓값 등**: 세그먼트 트리, 펜윅 트리(BIT)
- **우선순위 처리**: 힙(완전 이진 트리 기반)
- **그래프 문제에서 "사이클 없음"이 보장될 때**: 트리 DP, LCA(최소 공통 조상), 트리의 지름
- **유니온-파인드**: 집합을 트리 형태로 관리
- **백트래킹/완전 탐색의 상태 공간**: 재귀 호출 구조 자체가 트리

## 왜 이걸 쓰나 + 대안과 차이

| 구조 | 탐색 | 삽입/삭제 | 특징 |
|------|------|-----------|------|
| **배열** | 인덱스 O(1), 값 검색 O(N) | 중간 삽입 O(N) | 연속 메모리, 캐시 친화적 |
| **연결 리스트** | O(N) | 위치 알면 O(1) | 선형, 한 방향 관계만 |
| **균형 이진 탐색 트리** | O(log N) | O(log N) | 정렬 유지하며 검색/삽입 모두 빠름 |
| **해시 테이블** | 평균 O(1) | 평균 O(1) | 순서 없음, 범위 검색 불가 |
| **일반 그래프** | DFS/BFS O(V+E) | - | 사이클 가능, 다대다 관계 |

- **vs 연결 리스트**: 리스트는 "한 줄"이라 N개 중 검색에 O(N). 트리는 매 단계 후보를 절반씩 쳐낼 수 있어(BST) O(log N).
- **vs 해시**: 해시는 단일 키 조회는 빠르지만 "10 이상 50 이하 값 모두" 같은 **범위 질의**나 **정렬 순회**가 안 된다. 균형 트리는 이걸 자연스럽게 한다.
- **vs 일반 그래프**: 트리는 사이클이 없고 두 노드 사이 경로가 **유일**하다. 그래서 방문 체크가 단순해지고(부모만 빼면 됨) DP를 깔끔하게 얹을 수 있다.

## 동작 과정

### 1) 트리 용어와 모양

```
                 (1)  <- 루트(root): 부모가 없는 노드
                /   \
             (2)     (3)  <- 형제(sibling): 같은 부모
            /  \        \
         (4)   (5)      (6)  <- 리프(leaf): 자식이 없는 노드
                         |
                        (7)

  깊이(depth):  루트=0,  (2)(3)=1,  (4)(5)(6)=2,  (7)=3
  높이(height): 트리 전체 높이 = 가장 깊은 리프의 깊이 = 3
  (3)의 서브트리 = { 3, 6, 7 }
```

### 2) 이진 탐색 트리(BST)에 값 넣기 — 작으면 왼쪽, 크면 오른쪽

```
삽입 순서: 8, 3, 10, 1, 6, 14

8 삽입:        (8)

3 삽입:        (8)          3 < 8  -> 왼쪽
              /
            (3)

10 삽입:       (8)          10 > 8 -> 오른쪽
              /  \
            (3)  (10)

1 삽입:        (8)          1<8 왼쪽 -> 1<3 왼쪽
              /  \
            (3)  (10)
            /
          (1)

6 삽입:        (8)          6<8 왼쪽 -> 6>3 오른쪽
              /  \
            (3)  (10)
           /  \
         (1)  (6)

14 삽입:       (8)          14>8 오른쪽 -> 14>10 오른쪽
              /  \
            (3)  (10)
           /  \    \
         (1)  (6)  (14)
```

### 3) BST에서 값 6 찾기 — 매번 한쪽 가지만 따라가면 됨

```
찾는 값: 6

단계1: 현재=8.   6 < 8  -> 왼쪽으로
        (8)*
        /  \
      (3)  (10)

단계2: 현재=3.   6 > 3  -> 오른쪽으로
            (3)*
           /  \
         (1)  (6)

단계3: 현재=6.   6 == 6 -> 찾음!  (3번 비교로 끝)
                 (6)*
```

### 4) 순회(Traversal) 순서 — 같은 트리, 방문 규칙만 다름

```
        (8)
       /  \
     (3)  (10)
    /  \     \
  (1)  (6)   (14)

전위(Pre, 루트->왼->오):   8  3  1  6  10  14
중위(In,  왼->루트->오):   1  3  6  8  10  14   <- BST면 "정렬된 순서"!
후위(Post,왼->오->루트):   1  6  3  14 10  8
레벨(BFS, 위->아래/큐):    8  3  10  1  6  14
```

## C++ 예제 코드

```cpp
#include <bits/stdc++.h>
using namespace std;

// ── 이진 탐색 트리(BST) 노드 ─────────────────────────────
struct Node {
    int key;
    Node* left;
    Node* right;
    Node(int k) : key(k), left(nullptr), right(nullptr) {}
};

// 삽입: 작으면 왼쪽, 크면 오른쪽으로 내려가다 빈 자리에 단다.
// 새 루트(혹은 갱신된 서브트리 루트)를 반환하는 방식이 안전하다.
Node* insert(Node* root, int key) {
    if (root == nullptr) return new Node(key); // 빈 자리 발견 -> 여기 생성
    if (key < root->key)
        root->left = insert(root->left, key);  // 왼쪽 서브트리로
    else if (key > root->key)
        root->right = insert(root->right, key); // 오른쪽 서브트리로
    // key == root->key 인 중복은 무시 (정책에 따라 카운트 등 가능)
    return root;
}

// 검색: 매 단계 한쪽 가지만 타고 내려간다 -> 높이만큼만 비교.
bool search(Node* root, int key) {
    while (root != nullptr) {
        if (key == root->key) return true;
        root = (key < root->key) ? root->left : root->right;
    }
    return false;
}

// 중위 순회(In-order): 왼쪽 -> 자기 -> 오른쪽.
// BST에서는 결과가 "오름차순 정렬"로 나온다.
void inorder(Node* root, vector<int>& out) {
    if (root == nullptr) return;
    inorder(root->left, out);   // 1) 왼쪽 다 보고
    out.push_back(root->key);   // 2) 자신 방문
    inorder(root->right, out);  // 3) 오른쪽
}

// 트리의 높이(가장 깊은 리프까지의 간선 수). 빈 트리는 -1로 정의.
int height(Node* root) {
    if (root == nullptr) return -1;
    return 1 + max(height(root->left), height(root->right));
}

// 레벨 순회(BFS): 큐를 써서 위에서 아래로, 같은 깊이는 왼->오.
void levelOrder(Node* root) {
    if (root == nullptr) return;
    queue<Node*> q;
    q.push(root);
    while (!q.empty()) {
        Node* cur = q.front(); q.pop();
        cout << cur->key << ' ';
        if (cur->left)  q.push(cur->left);
        if (cur->right) q.push(cur->right);
    }
    cout << '\n';
}

// 사용한 메모리 해제(후위 순회로 자식 먼저 지운 뒤 자신 삭제).
void destroy(Node* root) {
    if (root == nullptr) return;
    destroy(root->left);
    destroy(root->right);
    delete root;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    Node* root = nullptr;
    for (int x : {8, 3, 10, 1, 6, 14})
        root = insert(root, x); // 반환값을 반드시 다시 받는다!

    vector<int> sorted;
    inorder(root, sorted);
    cout << "중위 순회(정렬): ";
    for (int v : sorted) cout << v << ' ';
    cout << '\n';

    cout << "6 검색: "  << (search(root, 6)  ? "있음" : "없음") << '\n';
    cout << "7 검색: "  << (search(root, 7)  ? "있음" : "없음") << '\n';
    cout << "높이: "    << height(root) << '\n';
    cout << "레벨 순회: ";
    levelOrder(root);

    destroy(root);
    return 0;
}
/* 출력 예시:
중위 순회(정렬): 1 3 6 8 10 14
6 검색: 있음
7 검색: 없음
높이: 2
레벨 순회: 8 3 10 1 6 14
*/
```

### 보너스: 인접 리스트로 표현한 "일반 트리" DFS (그래프형 트리 문제용)

```cpp
#include <bits/stdc++.h>
using namespace std;

vector<int> adj[100001]; // adj[u] = u와 연결된 노드들
int subtreeSize[100001]; // 각 노드를 루트로 한 서브트리 크기

// 부모(parent)를 들고 다니며 "왔던 길"로 되돌아가지 않게 한다.
// 트리는 사이클이 없으므로 방문 배열 대신 부모 비교만으로 충분.
void dfs(int u, int parent) {
    subtreeSize[u] = 1;                 // 자기 자신 포함
    for (int v : adj[u]) {
        if (v == parent) continue;      // 부모로는 다시 안 감
        dfs(v, u);
        subtreeSize[u] += subtreeSize[v]; // 자식 서브트리 크기 누적
    }
}

int main() {
    int n; cin >> n;            // 노드 수
    for (int i = 0; i < n - 1; i++) { // 트리는 간선 N-1개
        int a, b; cin >> a >> b;
        adj[a].push_back(b);
        adj[b].push_back(a);    // 무방향으로 양쪽 등록
    }
    dfs(1, 0);                  // 1번을 루트로, 부모는 없음(0)
    for (int i = 1; i <= n; i++)
        cout << i << ": " << subtreeSize[i] << '\n';
    return 0;
}
```

## 시간복잡도

| 연산 | 균형 잡힌 트리 | 한쪽으로 치우친 트리(최악) |
|------|---------------|---------------------------|
| 검색(BST) | O(log N) | O(N) |
| 삽입(BST) | O(log N) | O(N) |
| 삭제(BST) | O(log N) | O(N) |
| 순회(전위/중위/후위/레벨) | O(N) | O(N) |
| 높이 계산 | O(N) | O(N) |
| 트리 DFS/BFS (인접 리스트) | O(N) (간선이 N-1개) | O(N) |

- **핵심**: BST의 성능은 **높이에 비례**한다. 균형이 잘 잡히면 높이가 약 log₂N이라 빠르지만, 정렬된 데이터를 그대로 넣으면 한쪽으로만 길게 늘어져(사실상 연결 리스트) O(N)이 된다.
- 실무/대회에서는 이를 막기 위해 **자가 균형 트리**(AVL, 레드-블랙 트리)를 쓰며, C++의 `std::set`/`std::map`이 바로 이 레드-블랙 트리 기반이라 보장된 O(log N)을 준다.
- 공간복잡도는 노드 N개 + 각 노드의 포인터로 **O(N)**. 재귀 순회는 호출 스택으로 **O(높이)** 추가.

## 흔한 실수 / 팁

- **`insert`의 반환값을 안 받는 실수**: `insert(root, x);` 처럼 반환을 버리면 트리가 갱신 안 된다. 반드시 `root = insert(root, x);`. (위 예제처럼 "서브트리 루트를 반환" 패턴을 쓰면 안전하다.)
- **깊은 트리 + 재귀 = 스택 오버플로**: 노드가 한쪽으로 10만 개 늘어선 트리를 재귀 DFS로 돌면 콜 스택이 터질 수 있다. 깊이가 매우 클 땐 **명시적 스택(반복문)** 또는 BFS로 전환하거나, 균형을 보장하라.
- **트리 그래프에서 방문 처리**: 일반 그래프처럼 `visited[]`를 써도 되지만, 트리는 사이클이 없으니 **부모 노드만 제외**(`if (v == parent) continue;`)하면 충분하고 더 깔끔하다.
- **무방향 트리 입력**: 간선 `a b`가 주어지면 `adj[a]`와 `adj[b]` **양쪽 모두** 등록해야 한다. 한쪽만 넣으면 절반의 경로를 못 본다.
- **간선 개수 = N-1**: 트리는 노드 N개에 간선이 정확히 N-1개. 입력 반복을 `n-1`번 도는 걸 잊지 말 것. (N개 돌면 마지막에 입력 대기로 멈춘다.)
- **중위 순회 = 정렬**: BST에서 중위 순회 결과가 정렬되어 나오지 않으면 트리 구성(좌/우 비교 방향)이 틀린 것이다. 디버깅 체크포인트로 유용하다.
- **높이의 정의 통일**: "빈 트리 높이를 -1로 볼지 0으로 볼지", "리프 높이를 0으로 볼지 1로 볼지"는 문제마다 다르다. 코드 내에서 일관되게 정의하고 예제로 검증하라.
- **메모리 해제**: 대회에선 프로그램 종료 시 OS가 회수하니 생략하기도 하지만, 반복 생성/삭제가 있는 문제(예: 여러 테스트 케이스)에서는 `destroy`로 누수를 막아야 한다.
- **정렬된 데이터 주의**: 이미 정렬된 입력을 그냥 BST에 넣으면 최악(O(N)) 트리가 된다. 검색 성능이 중요하면 `std::set`/`std::map`을 쓰거나 입력을 섞어 넣어라.
