---
생성일: 2022-10-04
last_modified_at: 2022-10-04
강사:
  - 권오흠
플랫폼: 인프런
category: 알고리즘
tags:
  - 알고리즘
  - 권오흠알고리즘강좌
title: "[권오흠 영리한 프로그래밍을 위한 알고리즘 강좌] Recursion의 응용 - Maze"
---
Maze - 미로찾기

— Decision problem : 답이 yes or no

현재 위치~출구까지의 경로?

1. 현재 위치 = 출구
2. 이웃 셀 중 하나에서라도 <mark class="hltr-red">현재 위치를 지나지 않고</mark> 출구까지 갈 수 있는 경로가 있음

  

— Recursive Thinking

1. boolean findPath(x,y)
    
    if(x,y) is the exit return true; <mark class="hltr-cyan">(x,y)가 출구일경우 true</mark>
    
    else for each neighbouring cell (x’, y’) of (x,y) do if(x’,y’) is on the pathway and not visited  
      
    <mark class="hltr-cyan">인근의 셀 (x’,y’)가 경로가 없거나 이미 방문한 셀일경우</mark>
    
    if findePath(x’,y’) return true;
    
    return false;
    
2. boolean findPath(x,y)
    
    if (x,y) is either on the wall or a visited cell return false;
    
    else if(x,y) is the exit return true; <mark class="hltr-cyan">(x,y)가 출구일경우 true</mark>
    
    else mark (x,y) as a visited cell;
    
    for each nieghbouring cell (x’, y’) of (x,y) do
    
    if findePath(x’,y’) return true;
    
    return false;
    

⇒ 코드로

```java
import java.util.*;

public class Main {
	private static int n=8;
	private static int[][] maze = {
			{0,0,0,0,0,0,0,1},
			{0,1,1,0,1,1,0,1},
			{0,0,0,1,0,0,0,1},
			{0,1,0,0,1,1,0,0},
			{0,1,1,1,0,0,1,1},
			{0,1,0,0,0,1,0,1},
			{0,0,0,1,0,0,0,1},
			{0,1,1,1,0,1,0,0}
	};
	private static final int PATHWAY_COLOR=0; //지나갈 수 있는 길
	private static final int WALL_COLOR=1; //벽. 못지나감
	private static final int BLOCKED_COLOR=2; //가봤는데 경로없음
	private static final int PATH_COLOR=3; //가보긴했는데 경로있는지없는지 확실x
	
	public static boolean findMazePath(int x, int y) {
		if(x<0 || y<0 || x>=n || y>=n) 
			return false;
		else if(maze[x][y]!=PATHWAY_COLOR) 
			return false; //maze[x][y]가 visited(green, red) or wall(blue)인 경우 flase반환
		else if(x==n-1 && y==n-1) {
			maze[x][y] = PATH_COLOR;
			return true;
		}else {
			maze[x][y] = PATH_COLOR;
			if(findMazePath(x-1,y) || findMazePath(x,y-1) 
			|| findMazePath(x+1,y) || findMazePath(x,y+1))
		 //인근셀에 경로가있을경우(true일경우) true반환
				return true;
			
			maze[x][y] = BLOCKED_COLOR; //인근셀에 경로가 없다면 red처리
			return false;
		}
	}
public static void printMaze() {
	for(int i=0;i<maze.length;i++) {
		for(int j=0;j<maze[i].length;j++) {
			System.out.print(maze[i][j]+ " ");
		}
		System.out.println("");
	}
	System.out.println("");
}
	
	public static void main(String[] args) {
		printMaze();
		findMazePath(0,0);
		printMaze();
	}
}
```
