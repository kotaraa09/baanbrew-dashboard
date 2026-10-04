# ตรวจตัวเลขในเรื่องเล่าด้วย Excel / Google Sheets

ทุกตัวเลขในเรื่องเล่า "ห้าสาขา คนละจังหวะ" คำนวณจากไฟล์ `public/sales.csv`, `public/products.csv`, `public/branches.csv` และ `public/thai_holidays.csv` ด้วยฟังก์ชันใน `src/lib/story.js` และ `src/lib/metrics.js`
ไฟล์ทดสอบ `src/lib/story.test.js` คำนวณตัวเลขชุดเดียวกันซ้ำด้วยโค้ดที่เขียนแยกต่างหาก (ส่วน "truth check") เพื่อให้แน่ใจว่าสองวิธีได้ค่าตรงกัน

## หน่วยของข้อมูล

| หน่วย | นิยาม | ใน Excel |
|---|---|---|
| รายการ | 1 แถวใน `sales.csv` | `=ROWS(sales)` |
| บิล | `order_id` ที่ไม่ซ้ำ บิลหนึ่งมีหลายรายการได้ แต่ทุกรายการในบิลมีสาขาและเวลาเดียวกัน | `=COUNTA(UNIQUE(sales[order_id]))` |
| สมาชิก | `customer_id` ที่ไม่ว่างและไม่ซ้ำ | `=COUNTA(UNIQUE(FILTER(sales[customer_id], sales[customer_id]<>"")))` |

ยอดขาย = `qty × unit_price` · วันที่และชั่วโมงอ่านจากตัวอักษรใน `datetime` ตรง ๆ (เวลาไทย) ไม่แปลงเป็น UTC

## เตรียมตาราง

1. นำเข้า `sales.csv` เป็นตารางชื่อ `sales` แล้วเพิ่มคอลัมน์
   - `revenue` = `[@qty]*[@unit_price]`
   - `date` = `LEFT([@datetime],10)`
   - `hour` = `VALUE(MID([@datetime],12,2))`
   - `weekday` = `WEEKDAY(DATEVALUE([@date]),2)` (1 = จันทร์ … 7 = อาทิตย์)
   - `holiday` = `COUNTIF(holidays[date],[@date])>0`
2. นำเข้า `thai_holidays.csv` เป็นตารางชื่อ `holidays`
3. Pivot Table ที่นับ "บิล" ต้องเลือก **Add this data to the Data Model** แล้วใช้ **Distinct Count** ของ `order_id` (Google Sheets: `COUNTUNIQUEIFS`)

## ข้อความแต่ละขั้น

| ขั้น | ตัวเลข | วิธีตรวจ |
|---|---|---|
| 1 | จำนวนบิล / จำนวนรายการ | ตามตาราง "หน่วยของข้อมูล" |
| 2 | บิลต่อสาขา | Pivot: Rows = `branch`, Values = Distinct Count ของ `order_id` |
| 3 | % บิลก่อน 10:00 และชั่วโมงพีค | Pivot: Rows = `branch`, Columns = `hour`, Values = Distinct Count ของ `order_id`, Show Values As = % of Row Total แล้วรวมคอลัมน์ 7–9 |
| 4 | เสาร์–อาทิตย์ เทียบวันทำงาน | Pivot ยอดขายรายวัน: Rows = `date`, Columns = `branch`, Values = Sum ของ `revenue` เพิ่มคอลัมน์ `weekday` และ `holiday` แล้ว `=AVERAGEIFS(สาขา, weekday, ">=6", holiday, FALSE) / AVERAGEIFS(สาขา, weekday, "<=5", holiday, FALSE)` (นับเฉพาะวันที่สาขามียอดขาย) |
| 5 | สมาชิกของอารีย์ที่ไม่เคยซื้อที่อื่นก่อนเปิดสาขา | รายชื่อ `customer_id` ที่มีบิลที่อารีย์ → ต่อคน `=COUNTIFS(sales[customer_id], id, sales[date], "<2025-11-01")` ถ้าเป็น 0 = ลูกค้าใหม่ สัดส่วน = จำนวนลูกค้าใหม่ ÷ จำนวนสมาชิกของอารีย์ |
| 6 | มหาวิทยาลัยเดือนพฤษภาคม | Pivot: Rows = เดือน (`LEFT(date,7)`), Values = Distinct Count ของ `order_id` เฉพาะสาขามหาวิทยาลัย หารด้วยจำนวนวันที่มีข้อมูลในเดือนนั้น แล้วเทียบค่าเฉลี่ยของเดือนพฤษภาคมกับเดือนอื่น |
| 7 | วันหยุดนักขัตฤกษ์ เทียบวันปกติ | จับคู่วันหยุดแต่ละวันกับ "วันเดียวกันของสัปดาห์ถัดไป" (`วันหยุด + 7`) ถ้าวันนั้นเป็นวันหยุดหรือเลยวันสุดท้ายของข้อมูล ใช้ `วันหยุด − 7` แทน แล้วนับบิล (Distinct Count) ต่อสาขาในวันหยุดทั้งหมด ÷ บิลในวันคู่ทั้งหมด นับเฉพาะคู่ที่สาขาเปิดแล้วทั้งสองวัน |

## จังหวะของแต่ละสาขา และวิศวกรรมเมนู

- **ภูเขาแต่ละสาขา**: ตัวเลขเดียวกับขั้นที่ 3 (% ของบิลในแต่ละชั่วโมง) แต่กรองตามช่วงเวลาที่เลือก เส้นประคือ % ของทั้งเครือ
- **ตัวคูณเสาร์–อาทิตย์และวันหยุด**: วิธีเดียวกับขั้นที่ 4 และ 7 ในช่วงเวลาที่เลือก
- **วิศวกรรมเมนู**: เพิ่มคอลัมน์ `cost` = `XLOOKUP([@product_id], products[product_id], products[cost])` และ `margin` = `[@qty]*([@unit_price]-[@cost])` แล้ว Pivot: Rows = `product_id`, Values = Sum ของ `qty` และ Sum ของ `margin` · กำไรต่อชิ้น = margin ÷ qty · เส้นแบ่งสี่ช่อง = `MEDIAN` ของแต่ละคอลัมน์
  กำไรขั้นต้นนี้หักแค่ต้นทุนวัตถุดิบ ยังไม่หักค่าเช่า ค่าแรง หรือค่าคอมมิชชันของแอปเดลิเวอรี่
