---
생성일: 2022-10-05
최종 편집 일시: Invalid date
강사:
  - 권오흠
플랫폼: 인프런
title: "[권오흠 영리한 프로그래밍을 위한 알고리즘 강좌] Recursion의 응용  - counting cell in a blob"
category: 알고리즘
tags:
  - 알고리즘
  - 권오흠알고리즘강좌
---
- binary이미지.
- 각 픽셀은 backgound pixel이거나 혹은image pixel
- 서로 연결된 image pixel들의 집합을 blob이라 부름.
- 상하좌우 및 대각선 방향으로도 연결된 것으로 간주함.

→ 입력 : n*n크기의 그리드(grid), 하나의 좌표(x,y)

출력 : 픽셀 (x,y)가 포함된 blob의 크기, (x,y)가 어떤 blob에도 포함되지않으면 0

  

— Recursive Thinking

현재 픽셀이 image color가 x → 0  
현재 픽셀이 image color → count++,  
<mark class="hltr-cyan">중복 카운트를 막기 위해 다른색으로 변경</mark>, 현재 픽셀이 이웃한 모든 픽셀이 속한 blob의 크기를 카운트해 카운터에 더해줌.  
⇒ 카운터 반환  

—> if the pixel (x,y) is outside the grid → result 0;

else if pixel (x,y) is not an image pixel or already counted → result 0;

else set the color of the pixel (x,y) to a red color;

the result is 1 plus the number of cell in each piece of the blob that includes a nearest neighbour;

  

```java
import java.util.*;

public class Main {
	private static int n=8;
	private static int[][] grid = {
			{1,0,0,0,0,0,0,1},
			{0,1,1,0,0,1,0,0},
			{1,1,0,0,1,0,1,0},
			{0,0,0,0,0,1,0,0},
			{0,1,0,1,0,1,0,0},
			{0,1,0,1,0,1,0,0},
			{1,0,0,0,1,0,0,1},
			{0,1,1,0,0,1,1,1}
	};
	private static final int BACKGROUND_COLOR=0; //backgound pixel
	private static final int IMAGE_COLOR=1; //image pixel
	private static final int ALREADY_COLOR=2; //이미 셀렸음
	
	public static int countcells (int x, int y) {
		int result;
		if(x<0 || y<0 || x>=n || y>=n) return 0;
		else if(grid[x][y]!=IMAGE_COLOR) return 0;
		else {
			grid[x][y] = ALREADY_COLOR;
			return 1 + countcells(x-1,y+1) + countcells(x,y+1)+countcells(x+1,y+1)
			+countcells(x-1,y)+countcells(x+1,y)
			+countcells(x-1,y-1)+countcells(x,y-1)+countcells(x+1,y-1);
			}
		}
	private static void printgrid() {
		for(int x=0;x<n;x++) {
			for(int y=0;y<n;y++) {
				System.out.print(grid[x][y]+" ");
			}
			System.out.println();
		}
	}
	public static void main(String[] args) {
		printgrid();
		System.out.println();
		System.out.println("blob : "+countcells(5,3));
		System.out.println();
		printgrid();
	}
}
```
