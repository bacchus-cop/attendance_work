import { TYPE_CONFIG } from '../config.ts';
import { ClaimedNotificationRecord } from '../services/database.ts';
import { formatThaiTime } from './flexBase.ts';

/**
 * Formats daily summary message payload (plain text)
 */
export function buildDailySummaryPayload(targetDestination: string, record: ClaimedNotificationRecord) {
  return {
    to: targetDestination,
    messages: [
      {
        type: "text",
        text: record.message || record.title
      }
    ]
  };
}

/**
 * Builds body contents for single notification
 */
export function buildSingleBodyContents(record: ClaimedNotificationRecord, primaryConfig: { label: string }) {
  return [
    {
      type: "text",
      text: record.title,
      weight: "bold",
      size: "md",
      wrap: true,
      color: "#334155"
    },
    {
      type: "text",
      text: record.message || "-",
      size: "xs",
      color: "#64748b",
      wrap: true,
      margin: "sm",
      maxLines: 4
    },
    {
      type: "box",
      layout: "horizontal",
      margin: "md",
      contents: [
        {
          type: "text",
          text: primaryConfig.label,
          size: "xxs",
          color: "#94a3b8",
          flex: 1
        },
        {
          type: "text",
          text: formatThaiTime(record.created_at),
          size: "xxs",
          color: "#cbd5e1",
          align: "end"
        }
      ]
    }
  ];
}

/**
 * Builds body contents for batched notifications
 */
export function buildBatchBodyContents(claimedRecords: ClaimedNotificationRecord[]) {
  const bodyContents: any[] = [];

  bodyContents.push({
    type: "text",
    text: `คุณได้รับการแจ้งเตือนใหม่ ${claimedRecords.length} รายการ`,
    weight: "bold",
    size: "sm",
    color: "#1e293b",
    margin: "none"
  });

  // Limit display inside the LINE Flex bubbles to max 4
  const displayRecords = claimedRecords.slice(0, 4);
  displayRecords.forEach((rec: any, idx: number) => {
    const itemConfig = TYPE_CONFIG[rec.type] || TYPE_CONFIG['INFO'];

    bodyContents.push({
      type: "box",
      layout: "vertical",
      margin: idx === 0 ? "xs" : "md",
      paddingAll: "10px",
      backgroundColor: "#f8fafc",
      cornerRadius: "md",
      borderWidth: "1px",
      borderColor: "#e2e8f0",
      contents: [
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: `${itemConfig.emoji} ${rec.title}`,
              weight: "bold",
              size: "xs",
              wrap: true,
              color: "#334155",
              flex: 1
            }
          ]
        },
        rec.message ? {
          type: "text",
          text: rec.message,
          size: "xxs",
          color: "#64748b",
          wrap: true,
          margin: "xs",
          maxLines: 2
        } : null,
        {
          type: "box",
          layout: "horizontal",
          margin: "xs",
          contents: [
            {
              type: "text",
              text: itemConfig.label,
              size: "xxs",
              color: "#94a3b8",
              flex: 1
            },
            {
              type: "text",
              text: formatThaiTime(rec.created_at),
              size: "xxs",
              color: "#cbd5e1",
              align: "end"
            }
          ]
        }
      ].filter(Boolean) as any[]
    });
  });

  if (claimedRecords.length > 4) {
    bodyContents.push({
      type: "text",
      text: `• มีการแจ้งเตือนเพิ่มเติมอีก ${claimedRecords.length - 4} รายการในระบบ`,
      size: "xxs",
      color: "#6366f1",
      margin: "sm",
      align: "center",
      weight: "bold"
    });
  }

  return bodyContents;
}
