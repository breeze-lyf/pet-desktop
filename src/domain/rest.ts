export type RestActivityId = "eyes" | "water" | "stretch" | "breathing" | "walk";

export interface RestActivity {
  id: RestActivityId;
  title: string;
  durationMinutes: number;
  suggestion: string;
}

export const timerPresets = [25, 45, 60, 90] as const;

export const restActivities: RestActivity[] = [
  {
    id: "eyes",
    title: "护眼休息",
    durationMinutes: 3,
    suggestion: "看向远处，慢慢眨眼，让眼睛离开屏幕一会儿。"
  },
  {
    id: "water",
    title: "喝水",
    durationMinutes: 2,
    suggestion: "离开座位喝一口水，回来再继续。"
  },
  {
    id: "stretch",
    title: "肩颈拉伸",
    durationMinutes: 4,
    suggestion: "放松肩膀，轻轻转动脖子和手腕。"
  },
  {
    id: "breathing",
    title: "深呼吸",
    durationMinutes: 3,
    suggestion: "吸气四拍，停一拍，呼气六拍，重复三到五轮。"
  },
  {
    id: "walk",
    title: "走动一下",
    durationMinutes: 5,
    suggestion: "站起来走几步，让身体从久坐里醒过来。"
  }
];

export function getDefaultTimerMinutes() {
  return 60;
}
