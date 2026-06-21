#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Extract places from Google Sheets 'Plan' sheet and generate travel-planner JSON."""

import json
import uuid
from datetime import datetime

# Spreadsheet data from gws sheets spreadsheets values get
SHEET_DATA = {
  "majorDimension": "ROWS",
  "range": "Plan!A1:N142",
  "values": [
    ["時間", "地區", "行程", "開放時間 / 價錢", "Notes", "AI Research Notes", "Address", "Web Site 1", "Web Site 2", "Web Site 3", "Web Site 4", "Map Search", "Map Search Link"],
    ["Immigration", "", "\"Visit Japan\" QR Code", "", "提供辦理入境手續的、「入境審查」、「海關申報」和「免稅購買」的網上服務。", "", "", "", "", "", "", "\"Visit Japan\" QR Code", "Search"],
    ["", "", "申請國際車牌", "", "", "", "", "", "", "", "", "申請國際車牌", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["未安排日子", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["31/10月/2026 (週六)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["8am leave airport", "", "✈️ Flight HKG -> NRT", "", "CX524 01:25 -> 06:30"],
    ["9:30am arrive hotel", "", "🚄 Skyliner (NRT to 東京後樂園多美迎酒店) 1hr 15min"],
    ["10:30am leave hotel", "", "🧳 Hotel store luggage"],
    ["rent car?", "", "🚃 Train to 川越 / 🚙 airport rent car?"],
    ["", "", "江之電一日卷 800yen"],
    ["", "鐮倉", "鎌倉小町通 和牛壽司 - 牛兵衛", "", "極 套餐有晒3款牛肉壽司"],
    ["", "鐮倉", "咖哩包 - GIRAFFA", "", "連續三年金賞"],
    ["", "鐮倉", "鐮倉高校前 影平交道"],
    ["", "鐮倉", "日式糰子串 - さくらの夢見屋"],
    ["", "鐮倉", "大佛造型今川燒 - ともや"],
    ["", "鐮倉", "鎌倉莓座", "", "用16顆草莓打成的冰沙, 㨂紅茶底"],
    ["", "鐮倉", "鎌倉五郎（半月燒）", "", "半月形狀的法蘭酥"],
    ["", "鐮倉", "江之島瞭望燈塔", "09:00-20:00 ", "天氣好, 可以睇到富士山\n先買塔飛, 再加錢搭電梯上去"],
    ["", "鐮倉", "???"],
    ["Hotel", "", "東京後樂園多美迎酒店", "", "如果錯過了食拉麵的時間，亦可以到櫃檯拿免費的杯麵回房間吃。", "", "", "", "", "", "", "東京後樂園多美迎酒店", "Search"],
    ["01/11月/2026 (週日)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "草津", "草津", "", "", "", "", "", "", "", "", "草津", "Search"],
    ["", "草津", "草津溫泉湯畑", "", "日同夜要各去一次, 景色會有不同", "🌐 https://www.kusatsu-onsen.jp/ | 🕐 24小時開放 (露天區域) | 💰 免費進入湯畑區域 | 💡 日同夜景色不同。夜晚有燈光裝飾。免費參觀。", "", "【2026草津溫泉】人氣草津景點美食、住宿與交通攻略！日本溫泉百選難波萬！", "", "", "草津溫泉湯畑", "Search"],
    ["", "草津", "清月堂 抺茶提拉米蘇", "", "", "🕐 10:00～17:00 | 💰 抹茶提拉米蘇 800-1,000日圓 | 💡 草津在地甜點名店。抹茶提拉米蘇是招牌。", "", "", "", "清月堂 抺茶提拉米蘇", "Search"],
    ["", "草津", "溫泉布丁, 釜飯都很出名", "", "", "", "", "", "", "", "溫泉布丁, 釜飯都很出名", "Search"],
    ["", "", "草津溫泉布丁 本店", "", "食布丁, 布丁雪糕", "🕐 10:00～17:00 | 💰 布丁 500-800日圓 | 💡 溫泉布丁和布丁雪糕是特色。用草津溫泉製作的布丁。"],
    ["", "草津", "熱乃湯\n熱乃湯一天會舉行 6 個場次的湯揉表演。\n場次睇官網 in link 2", "", "冇得網上購票, 只可以現場買. \n官網有折扣巻 700yen -> 650yen (Link 3)\n午前最後一場和午後第一場會最多人, 要避開!\n\n坐2/F, 影相好似靚D\n排隊購買門票的人非常多。每個表演場次前 30 分鐘開始售票，我建議至少場次開始前 20 分鐘就得來購買門票，避免買不到門票而需要等更久的時間喔！", "🌐 https://www.hinoyuyu.com/ | 🕐 湯揉表演每天6場 (時間視季節變化) | 💰 門票 700yen → 650yen (官網折扣巻) | 📅 現場購買，無網上購票。建議場次前20分鐘到。 | 💡 午前最後一場和午後第一場最多人。2/F影相靚D。官網有折扣券。", "", "【熱乃湯】草津溫泉必看的湯揉表演｜表演時間、門票費用、心得", "湯もみと踊りショー｜草津温泉 熱乃湯", "Discount Coupon", "", "熱乃湯\n熱乃湯一天會舉行 6 個場次的湯揉表演。\n場次睇官網 in link 2", "Search"],
    ["", "草津", "おさ湯（osayu）\n\n猴子湯揉＋水豚互動套票 \nおさ湯・かぴ湯セット券\n1100yen\n買票網頁在 link 2", "", "動物版本的猴子湯揉表演\n\n一樓可觀賞由猴子演出的湯揉表演，二樓則能與水豚、兔子、貓咪等動物互動。門票分開購買。\n\n要注意猴子湯揉表演全程禁止拍照、錄影，表演最後會提供一小段時間拍照。", "🌐 https://www.osayu.com/ | 🕐 猴子湯揉表演多場 (詳情見官網) | 💰 猴子湯揉＋水豚互動套票 1100yen | 📅 現場購買或網上購票 | 💡 一樓猴子湯揉全程禁止拍照錄影。二樓可與水豚/兔子/貓咪互動。", "", "【草津溫泉】おさ湯（Osayu）猴子湯揉表演｜場次、門票價格", "群馬 草津温泉 おさるの湯もみ処 おさ湯 入場Eチケット【セット券は100円お得】", "", "", "おさ湯（osayu）\n\n猴子湯揉＋水豚互動套票 \nおさ湯・かぴ湯セット券\n1100yen\n買票網頁在 link 2", "Search"],
    ["", "草津", "草津ガラス蔵 温泉たまご", "", "現場製作的溫泉蛋", "🌐 https://kusatsu-garasuzako.com/ | 🕐 10:00～17:00 | 💰 溫泉蛋 100-200日圓/個 | 💡 現場製作半熟溫泉蛋。用草津溫泉的硫磺蛋。", "", "【草津溫泉】草津ガラス蔵温泉たまご｜現煮的半熟溫泉蛋🥚 - 霧痴", "", "", "草津ガラス蔵 温泉たまご", "Search"],
    ["Closed off?", "草津", "柏香亭", "11:00~17:00(週四休", "蕎麥麵名店\n炸舞菇 必點", "🍽 https://tabelog.com/gunma/A1003/A100301/10001234/ | 🕐 11:00~17:00 (週四休) | 💰 蕎麥麵 800-1,500日圓 | 💡 蕎麥麵名店，Tabelog評分3.62。炸舞菇必點。", "群馬縣吾妻郡草津町草津376", "【草津溫泉美食】柏香亭：人氣必點蕎麥麵＆炸舞菇，樸實無華在地美味(Tabelog 3.62) - Mimi韓の旅遊指南", "", "", "柏香亭", "Search"],
    ["", "草津", "草津溫泉", "", "", "", "", "", "", "", "草津溫泉", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["02/11月/2026 (週一)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "四萬溫泉", "四萬溫泉", "", "", "", "", "", "", "", "四萬溫泉", "Search"],
    ["", "四萬溫泉", "竹井橋＋四萬湖", "", "", "", "", "", "", "", "竹井橋＋四萬湖", "Search"],
    ["", "四萬溫泉", "四萬甌穴", "", "", "", "", "", "", "", "四萬甌穴", "Search"],
    ["03/11月/2026 (週二)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "輕井澤", "輕井澤 睇紅葉", "", "", "", "", "", "", "", "輕井澤 睇紅葉", "Search"],
    ["", "輕井澤", "白絲瀑布", "", "", "🌐 https://www.karuizawa.gr.jp/shiraito/ | 🕐 24小時開放 (步道時段 9:00-16:00) | 💰 免費參觀 | 💡 輕井澤著名景點。瀑布落差20米，寬60米。步道需穿防滑鞋。", "", "白絲瀑布", "Search"],
    ["", "輕井澤", "雲場池", "", "", "🌐 https://www.karuizawa.gr.jp/unkubo/ | 🕐 9:00-17:00 (季節變化) | 💰 免費參觀 | 💡 紅葉季節特別美。從輕井澤站步行約30分鐘。", "", "雲場池", "Search"],
    ["Lunch", "", "川上庵蕎麥麵 軽井沢 川上庵 本店", "10:00-22:00 (LO21:00)", "川上庵招牌就是蕎麥麵", "🌐 https://gogojp.tw/harunire-terrace/ | 🕐 10:00-22:00 (LO21:00) | 💰 蕎麥麵 1,000-1,800日圓 | 💡 位於Harunire Terrace。招牌就是蕎麥麵。", "", "https://gogojp.tw/harunire-terrace/"],
    ["", "輕井澤", "舊輕井澤銀座通", "", "", "", "", "", "", "", "舊輕井澤銀座通", "Search"],
    [],
    ["", "輕井澤", "榆樹街小鎮", "", "付費停車場(即下圖P2和P3)，前30分鐘免費，之後每小時300円～如於榆樹街小鎮、村民食堂、蜻蜓之湯消費達2000円可免費停2小時，把停車卡給在消費的店舖做折抵～\n\n或者可停放於P6、P7，為免費停車場～", "🌐 https://www.hoshino-area.jp/zh-TW/harunire-terrace/ | 🕐 各店營業時間不同，一般10:00-18:00 | 💰 免費進入 | 📅 停車: 前30分鐘免費，之後每小時300円。消費滿2000円免費停2小時。 | 💡 Hoshino Resorts管理。P6、P7為免費停車場。", "", "https://gogojp.tw/harunire-terrace/", "", "", "榆樹街小鎮", "Search"],
    ["", "輕井澤", "IKARU cafe", "10:00-17:00 (LO16:30)", "靚樣咖啡", "🌐 https://www.hoshino-area.jp/zh-TW/ikarucafe/ | 🕐 10:00-17:00 (LO16:30) | 💰 咖啡 600-800日圓 | 💡 Hoshino Resorts旗下。IG熱門打卡點。靚樣咖啡。", "", "https://www.hoshino-area.jp/zh-TW/ikarucafe/"],
    ["Dinner", "輕井澤", "村民食堂", "11:30～21:30，7/15～8/31為11:00～22:00，9月以後，毎月第3個週三只營業17:00～21:30", "約營業時間前30分鐘發放號碼牌", "🌐 https://www.hoshino-area.jp/zh-TW/sonmin-shokudo/ | 🕐 11:30～21:30 (7/15～8/31為11:00～22:00，9月以後毎月第3個週三只營業17:00～21:30) | 💰 套餐 1,500-2,500日圓 | 📅 約營業時間前30分鐘發放號碼牌 | 💡 Hoshino Resorts旗下。需排隊拿號碼牌。", "", "https://www.hoshino-area.jp/zh-TW/sonmin-shokudo/#usage-guide", "", "", "村民食堂", "Search"],
    ["", "輕井澤", "石之教堂", "", "", "🌐 https://www.ishinocapelle.jp/ | 🕐 9:00-17:00 (冬季可能調整) | 💰 參觀 300日圓 | 💡 輕井澤著名教堂。由安藤忠雄設計。可舉行婚禮。", "", "", "石之教堂", "Search"],
    ["", "輕井澤", "聖保羅天主教堂", "", "", "🌐 https://st-pauls.jp/ | 🕐 9:00-17:00 | 💰 免費參觀 | 💡 輕井澤著名教堂。有YouTube影片介紹。", "", "https://www.youtube.com/watch?v=OQsUxANe8iE", "", "", "聖保羅天主教堂", "Search"],
    ["", "", "蜻蜓之湯 泡溫泉", "", "Hoshino Resorts BEB5 Karuizawa房客只要600円/人 (原大人1350円、3歲~國小800円)", "🌐 https://www.hoshino-area.jp/zh-TW/tonbo-no-yu/ | 🕐 8:00-23:00 (Hoshino Resorts BEB5住客專用) | 💰 Hoshino BEB5住客 600円/人 (原1350円) | 💡 Hoshino Resorts BEB5 Karuizawa住客專用溫泉。非住客需確認是否開放。"],
    ["04/11月/2026 (週三)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["Breakfast", "輕井澤", "丸山咖啡", "09:00~19:00", "本店只有咖啡和雪糕, 分店有crepe\n買咖啡餅, 咖啡味馬卡龍", "🌐 https://www.maruyama-coffee.jp/ | 🕐 09:00~19:00 | 💰 咖啡 500-800日圓 | 💡 本店只有咖啡和雪糕。分店有crepe。買咖啡餅/咖啡味馬卡龍。", "", "丸山咖啡", "Search"],
    [],
    [],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "輕井澤", "王子購物廣場 Outlet", "", "", "🌐 https://www.okinose.co.jp/karuizawa/ | 🕐 10:00-20:00 (店鋪時間可能不同) | 💰 免費進入 | 💡 大型Outlet商場。多個國際品牌。", "", "王子購物廣場 Outlet", "Search"],
    [],
    ["", "Disneyland", "Car parking @ IKSPIARI shopping mall", "", "Cost: ¥800 for the first hour, then ¥400 for each additional 30 minutes.Discount: You can get up to 1 hour free if you spend ¥2,000 or more, up to 5 hours free for spending ¥10,000 or more, or free all-day parking if you spend ¥30,000 or more at Ikspiari shops/restaurants.Details: Check the IKSPIARI Access Page for full operational hours and discount details. https://www.ikspiari.com/en/access/car.html", "", "", "", "Car parking @ IKSPIARI shopping mall", "Search"],
    ["", "Disneyland", "迪士尼樂園 外伴手禮店「旅途愉快」Bon Voyage", "08:00 - 22:00", "", "", "迪士尼樂園 外伴手禮店「旅途愉快」Bon Voyage", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["05/11月/2026 (週四)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["8am rent car?", "", "Nissan rent-a-car"],
    ["8:15-9:45am", "", "🚙 1hr15min drive from hotel to 町田リス園"],
    ["10am-12pm", "町田", "🐿️ 町田松鼠園 町田リス園", "Tue close", "松鼠公園 500yen", "🌐 https://www.machida-risuen.com/ | 🕐 10:00-17:00 (週二休息) | 💰 入場費 500yen | 💡 松鼠公園。週二休息。需預約。", "東京都町田市薬師台1-733-1", "https://www.instagram.com/reel/DUVNLMnjxCP/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", "https://www.machida-risuen.com/", "", "", "🐿️ 町田松鼠園 町田リス園", "Search"],
    ["12-1:30pm", "??????", "🚙 1hr15min drive from 町田リス園 to 鐮倉"],
    ["", "川越市", "川越", "", "", "", "", "", "", "", "川越", "Search"],
    ["", "川越市", "川越 星巴克", "08:00–20:00", "", "🌐 https://store.starbucks.co.jp/detail-1554/ | 🕐 08:00–20:00 (星巴克標準營業時間) | 💡 川越站エキア店。另有ルミネ川越店。", "", "https://wow-japan.com/attractions-kawagoe-one-day-trip/#google_vignette", "", "", "川越 星巴克", "Search"],
    ["", "川越市", "川越 時之鐘", "", "每天早上6點、中午12點、下午3點和6點還能聽見清澈的鐘聲。", "🌐 https://koedo.or.jp/spot_001/ | 🕐 每天早上6點、中午12點、下午3點和6點敲鐘 | 💰 免費參觀 | 💡 川越在地標。每天4次敲鐘。免費參觀。", "", "川越 時之鐘", "Search"],
    ["", "川越市", "川越 一番街（老街巡禮）", "", "", "", "", "川越 一番街（老街巡禮）", "Search"],
    ["", "川越市", "Miffy kitchen&Bakery", "10:00–18:00", "川越店限定的紅薯麵包、米飛兔吐司", "🌐 http://miffykitchenbakery.jp/ | 🍽 https://tabelog.com/saitama/A1103/A110303/11058701/ | 🕐 10:00–18:00 (週一休息) | 💰 麵包/飲品 500-1,200日圓 | 💡 川越限定紅薯麵包和米飛兔吐司。建議早到。", "", "Miffy kitchen&Bakery", "Search"],
    ["Lunch", "川越市", "和心 −器と卵かけごはん−\n和心 雞蛋拌飯專門店", "11:00-17:00", "有震震布丁\nㄉㄨㄞㄉㄨㄞ 布丁", "🌐 https://wagokoro.studio.site/ | 🍽 https://tabelog.com/saitama/A1103/A110303/11061542/ | 🕐 11:00-17:00 (週一休息) | 💰 卵かけごはん套餐 1,000-1,500日圓 | 💡 震震布丁是特色。有震震布丁和各種卵かけごはん。", "埼玉県川越市新富町1-6-11TDUビルB1", "Facebook", "Official IG", "", "", "和心 −器と卵かけごはん−\n和心 雞蛋拌飯專門店", "Search"],
    ["Snack", "川越市", "焼き芋 COEDO HACHI 川越", "10:00-17:00", "將收成的紅薯「醃製」後，在放到濕度約80%的儲藏室中儲存兩個月直到成熟，接著在放入特製鍋中精心烘烤兩個小時，使澱粉慢慢糖化，變成如蜜一般熱騰騰綿密的烤地瓜，再加上卡士達布丁充滿幸福的甜味！", "🌐 https://coedohachi.jp/ | 🍽 https://tabelog.com/saitama/A1103/A110303/11058882/ | 🕐 10:00-17:00 (週一休息) | 💰 烤地瓜 300-500日圓 | 💡 紅薯經過醃製、儲存、精心烘烤。卡士達布丁也很受歡迎。", "川越市元町2-1-6", "https://coedohachi.jp/", "", "", "焼き芋 COEDO HACHI 川越", "Search"],
    ["Snack", "川越市", "小江戸おさつ庵", "11:00～17:00", "將薯片切成扁而長的薄片，不添加任何糖，只灑上一點鹽作些許調味，可以嚐到地瓜本身的甜味", "📸 https://www.instagram.com/koedoosatsuan/ | 🕐 11:00～17:00 (週一休息) | 💰 地瓜片 400-600日圓 | 💡 地瓜片不添加糖，只灑少許鹽。IG上有最新資訊。", "埼玉縣川越市幸町15-21", "", "", "", "", "小江戸おさつ庵", "Search"],
    ["", "川越市", "LEMONADE by Lemonica", "10:00～18:00", "以獨家手法與配方，將一個個的新鮮檸檬中提取汁液，再加入特製糖漿調和而成的「Refresh Drink」。", "🌐 https://lemonade-by-lemonica.com/shops.html | 🍽 https://tabelog.com/saitama/A1103/A110303/11049305/ | 🕐 10:00～18:00 | 💰 檸檬汁 600-800日圓 | 💡 獨家手法提取新鮮檸檬汁，加入特製糖漿調和。", "埼玉県川越市元町2-9-19", "", "", "", "LEMONADE by Lemonica", "Search"],
    ["", "川越市", "川越布丁(川越プリン)", "11:00～17:00", "", "🌐 https://kawagoe-purin.com/ | 🛒 https://kawagoepurin.theshop.jp/ | 🕐 11:00～17:00 (週一休息) | 💰 布丁 500-800日圓 | 💡 川越在地布丁名店。有網購選項。", "埼玉県川越市幸町1-13", "https://kawagoepurin.theshop.jp/", "", "", "川越布丁(川越プリン)", "Search"],
    ["", "渋谷", "挽肉と米 渋谷", "11:00-21:00 第一,三個週三休息", "食漢堡扒, 一定要預約\n提前優先票（每席1,000日圓）\n適用於來自海外等遠方的顧客。此為「限量販售」的票券，可提前確保您的座位。\n該票券於每月1日開放，提供至次月底的預約。\n您可於用餐日前8天至最多2個月前確保座位。\n每人將收取1,000日圓的票券費用以及1,980日圓的套餐費用。\n提前優先票費用於用餐日前7天內恕不退款。\n\n一般登記（免費）\n您可於用餐日前最多7天內確保座位。（先到先得）\n每日約上午9點開放7天後的預約。\n由於由工作人員手動操作，開放時間可能會略有差異。\n當日可能因取消而釋出名額，歡迎隨時於線上確認。\n當日各時段的空位資訊將公布於 X（原 Twitter）。", "🌐 https://hikinikutocome.com/locations/shibuya | 🐦 https://x.com/hikinicutocome2 | 🍽 https://tabelog.com/tokyo/A1303/A130301/13257261/ | 🕐 11:00-21:00 (第一、三週三休息) | 💰 定食套餐 1,980日圓起 + 1,000日圓提前票 | 📅 每月1日開放次月預約，用餐日前8天至2個月前可預約 | 💡 TableCheck可預約。官網有詳細預約說明。", "東京都澀谷區道玄坂 2-28-1 椎津大樓 3 樓\r\n03-6455-2959\r\n", "Blog", "Official Web", "Reservation", "", "挽肉と米 渋谷", "Search"],
    [],
    ["06/11月/2026 (週五)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "???", "breakfast???"],
    ["10am-10:30am", "", "(🚃 Train 30min from hotel to harry potter)", "", "早啲去影相"],
    ["Booked 12:15 @ 2026-11-06 \n提早11:30到，借字幕機。\n4:15pm完", "赤坂站", "🎭 哈利·波特與被詛咒的孩子 舞台劇", "", "2026-10-07起, 打開email連結download QR code.\n\n總長含休息約3小時40分鐘, 有字幕眼鏡借\n●Sプラス席  16,000円 x 2 \n■サービス利用料・手数料\n服務利用料：440円\n発券手数料：110円\n■合計金額\n32,550円 (Paid by A's MMpower)\n1階  S列 20番, 21番", "🌐 https://www.harrypotter-stage.jp/ | 🕐 演出時間視節目表 | 💰 Sプラス席 16,000円 x 2 = 32,550円 (含服務費) | 📅 已預訂 12:15場。1階 S列 20番, 21番。總長含休息約3小時40分鐘，有字幕眼鏡借。 | 💡 赤坂站。已確認預訂。", "TBS赤坂ACTシアター", "https://www.harrypotter-stage.jp/schedule-tickets/", "Floor Plan", "入場QR code", "", "赤坂站", "Search"],
    ["4:30pm-5:30pm book?", "赤坂站", "☕️ 哈利·波特與 Cafe", "", "Cafe 可以預約", "🌐 https://www.tablecheck.com/en/shops/harrypotter-tokyo/reserve | 🕐 11:00-21:00 | 💰 餐飲 1,500-3,000日圓 | 📅 TableCheck可預約 | 💡 哈利波特主題Cafe。可透過TableCheck預約。\n\n咖啡時段 (Cafe)：10:00 – 17:00\n晚餐時段 (Dinner)：17:00 – 22:00\n外帶專賣店 (Harry Potter Cafe Window)：11:00 – 21:00", "", "https://www.tablecheck.com/en/shops/harrypotter-tokyo/reserve"],
    ["???"],
    ["", "", "🪄哈利波特原宿旗艦店\nハリー・ポッター ショップ 原宿", "11:00～21:00", "", "🌐 https://harrypotter-store.jp/ | 🕐 11:00～21:00 | 💰 商品 500-10,000日圓 | 💡 原宿店。哈利波特周邊商品。", "東京都渋谷区神宮前6-31-17", "https://tokyo.letsgojp.com/archives/336600/", "", "", "🪄哈利波特原宿旗艦店\nハリー・ポッター ショップ 原宿", "Search"],
    ["", "", "???"],
    ["07/11月/2026 (週六)", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "ひもかわ桐生 池袋店", "11:00～15:30\n18:00～21:00", "寬烏冬", "", "https://www.instagram.com/p/DW1LAZXgUxz/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", "", "", "ひもかわ桐生 池袋店", "Search"],
    ["", "", "suscrea (サスクリエ)", "", "薪火Omakase, 這間店由米芝蓮二星主廚與創意料理大廚共同打造", "🍽 https://tabelog.com/tokyo/A1305/A130502/13356789/ | 📋 https://www.tablecheck.com/ja/shops/suscrea/reserve | 🕐 晚餐服務 | 💰 Omakase 15,000-25,000日圓 | 📅 TableCheck預約。米芝蓮二星主廚打造。 | 💡 薪火Omakase。米芝蓮二星主廚與創意料理大廚共同打造。地址: 東京都港区南青山3-14-28 KRKビル 2F", "京都港區南青山3-14-28 KRKビル 2\r\n表參道站A4出口步行3分鐘", "https://www.instagram.com/reel/DW6GCSgE2YD/?utm_source=ig_web_copy_link&igsh=MzRlODBiNWFlZA==", "https://www.tablecheck.com/ja/shops/suscrea/reserve", "", "", "suscrea (サスクリエ)", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "買咖啡餅, 咖啡味馬卡龍", "", "https://vocus.cc/article/64678ef0fd897800017a881a", "", "", "Search"],
    ["", "", "かに地獄", "", "燒帝王蟹, 按g計錢", "", "https://www.youtube.com/watch?v=ZBMfrOOqVqA", "https://tabelog.com/tokyo/A1301/A130103/13114768/", "", "かに地獄", "Search"],
    ["1/10 訂", "恵比寿\r\n", "蕃 YORONIKU\n", "", "每月1號  日本時間 00:00 訂下一個月", "🌐 https://yoroniku-ebisu.com/ | 🍽 https://tabelog.com/tokyo/A1303/A130302/13211927/ | 📋 https://www.tablecheck.com/ja/shops/ebisu-yoroniku/reserve | 🕐 18:00-23:00 (週一、週二休息) | 💰 燒肉套餐 5,000-10,000日圓 | 📅 每月1號 日本時間 00:00 開放下個月預約 (TableCheck) | 💡 TableCheck預約系統。每月1日00:00 (JST) 開放次月預約。", "", "Table check", "", "", "v"],
    ["Buy", "東京橋/銀座/新宿", "noix de beurre 法式甜品 ノワ・ドゥ・ブール 新宿伊勢丹店", "10:00–20:00", "好多人排隊", "🌐 https://noixdebeurre.jp/ | 📸 https://www.instagram.com/noixdebeurre_official/ | 🕐 10:00–20:00 (無休) | 💰 甜品 800-1,500日圓 | 💡 東京橋/銀座/新宿均有分店。人氣法式甜品店，經常排隊。", "", "noix de beurre 法式甜品 ノワ・ドゥ・ブール 新宿伊勢丹店", "Search"],
    ["Eat", "澀谷", "The Roast Beef Rice JYU ザ・ローストビーフライス JYU", "12時～15時／17時～22時", "牛肉蓋飯", "🍽 https://tabelog.com/tokyo/A1303/A130301/13293898/ | 🕐 12時～15時／17時～22時 | 💰 牛肉蓋飯套餐 1,200-1,800日圓 | 💡 可透過AutoReserve預約。人氣牛肉蓋飯專門店。", "東京都澀谷區澀谷2丁目22-16 TR大樓B1F", "https://www.instagram.com/p/C3kkfW6vC6e/", "", "", "The Roast Beef Rice JYU ザ・ローストビーフライス JYU", "Search"],
    ["", "", "stand hiroki  #ヒロキヤ渋谷", "", "生牛肉飯, 每日限量30份", "🌐 https://hirokiya-group.com/ | 🍽 https://tabelog.com/tokyo/A1303/A130301/13289319/ | 🕐 17:00-23:00 (無休) | 💰 生牛肉飯套餐 1,500-2,000日圓 | 📅 每日限量30份，建議早到 | 💡 已更名為 #ヒロキヤ渋谷 (Hirokiya Shibuya)。生牛肉飯每日限量30份，建議早到。", "", "https://www.instagram.com/reel/Cz3cfbvvhTO/?igshid=MzRlODBiNWFlZA==", "", "", "stand hiroki  #ヒロキヤ渋谷", "Search"],
    ["", "", "川崎 日枝大神社 ", "", "Sanrio 御朱印", "", "Address???", "", "", "川崎 日枝大神社 ", "Search"],
    ["", "", "東京法輪寺", "", "花水手剪紙御守", "", "東京法輪寺", "Search"],
    ["訂去酒店？", "", "有樂町 飯團 よこみぞゆり", "", "送貨/popup shop (要睇X/IG)", "", "https://yokomizoyuri.com/shops/norionigiriya", "https://www.instagram.com/norionigiriya?igsh=cjEyanlhZDNramw2", "", "有樂町 飯團 よこみぞゆり", "Search"],
    ["", "", "赤阪冰川神社", "", "", "🌐 https://www.akasakahikawa.or.jp/ | 🌐 https://www.ntv.co.jp/oo-dokei/ | 🌐 http://akasakahikawa.onamae.jp/"],
    ["", "", "宮崎駿大時計", "Mon - Fri 12:00, 15:00, 18:00,20:00\nSat, Sun 10:00, 12:00, 15:00, 18:00,20:0", "", "https://www.facebook.com/share/r/1GhK7SHevj/?mibextid=wwXIfr", "", "宮崎駿大時計", "Search"],
    ["", "", "Kushiyaki Meat Man クシヤキ肉男Meat Man", "", "", "日本〒150-0043 Tokyo, Shibuya, Dogenzaka, 2 Chome−20−10 １階", "https://www.instagram.com/p/DZpdH-9IXit/", "", "", "Kushiyaki Meat Man クシヤキ肉男Meat Man", "Search"],
    ["", "", "Butter Butler (東京車駅)", "", "費南雪專門店", "", "Butter Butler (東京車駅)", "Search"],
    ["08/11月/2026 (週日)", "", " ", "", "", "", "", "", "", " ", "Search"],
    ["", "???", "???", "", "", "", "", "", "", "???", "Search"],
    [],
    ["5:30pm leave hotel", "", "Hotel取行李"],
    ["7:00pm到機場", "", "🚄 Skyliner (東京後樂園多美迎酒店 to NRT) 1hr 15min"],
    ["21:30 ~ 02:00+1 @ 8-NOV-2026", "", "CX501 NRT - HKG", "", "", "", "", "", "CX501 NRT - HKG", "Search"],
    ["End", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "クロスケの家 (小黑炭的家) 500yen", "星期二,三,六\n午前の部 10：00～12：00／午後的部 13:00～15:00", "2個月前預約", "🌐 https://www.totoro.or.jp/kurosuke/ | 🕐 星期二,三,六 午前の部 10:00～12：00／午後的部 13:00～15:00 | 💰 500yen | 📅 2個月前預約 | 💡 龍貓相關景點。需提前2個月預約。", "", "https://www.totoro.or.jp/kurosuke/", "https://www.instagram.com/reel/DZPnK0II4ez/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==", "", "クロスケの家 (小黑炭的家) 500yen", "Search"],
    ["", "", "龍貓森林（トトロの森）", "", "", "🌐 https://tokyo.letsgojp.com/archives/283525/ | 🕐 24小時開放 (建議白天前往) | 💰 免費 | 💡 トトロの森。多摩地區。適合自然散步。", "", "https://tokyo.letsgojp.com/archives/283525/", "", "龍貓森林（トトロの森）", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "上高地", "", "", "🌐 https://kamikochi.or.jp/ | 🕐 11月-5月: 禁止進入 (封山) | 💰 免費進入 (但需乘坐接駁巴士) | 📅 接駁巴士需提前預約 (巴士公司官網) | 💡 ⚠️ 11月可能已接近封山期 (通常11月中旬開始)。需確認開放狀態。", "", "上高地", "Search"],
    ["", "", "日本・岡山倉敷｜阿智神社", "", "有愛心眉毛的達磨", "🕐 9:00-17:00 | 💰 免費 | 💡 有愛心眉毛的達磨。Instagram熱門景點。", "https://www.instagram.com/reel/DVNns2PE7wB/?igsh=MWFjb3doajl0OGg5Yw==", "", "日本・岡山倉敷｜阿智神社", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"],
    ["", "", "", "", "", "", "", "", "", "", "", "", "Search"]
  ]
}

# Place type classification
PLACE_TYPES = {
    'restaurant': {'name': '餐廳', 'color': '#FF6B6B'},
    'hotel': {'name': '酒店', 'color': '#4ECDC4'},
    'snack': {'name': '小吃', 'color': '#FFD93D'},
    'sightseeing': {'name': '景點', 'color': '#6BCB77'},
    'park': {'name': '公園', 'color': '#4D96FF'},
    'museum': {'name': '博物館', 'color': '#9B59B6'},
    'temple': {'name': '寺廟/神社', 'color': '#E67E22'},
    'onsen': {'name': '溫泉', 'color': '#1ABC9C'},
    'shopping': {'name': '購物', 'color': '#E91E63'},
    'cafe': {'name': '咖啡', 'color': '#795548'},
    'entertainment': {'name': '娛樂', 'color': '#FF5722'},
    'nature': {'name': '自然', 'color': '#00BCD4'},
    'church': {'name': '教堂', 'color': '#607D8B'},
    'parking': {'name': '停車場', 'color': '#8BC34A'},
    'transport': {'name': '交通', 'color': '#9E9E9E'},
    'other': {'name': '其他', 'color': '#607D8B'}
}

# Emoji mapping by type
TYPE_EMOJIS = {
    'restaurant': ['🍽️', '🍴'],
    'hotel': ['🏨', '🏩'],
    'snack': ['🍰', '🍡'],
    'sightseeing': ['📸', '🗺️'],
    'park': ['🌳', '🌸'],
    'museum': ['🏛️'],
    'temple': ['⛩️', '🏯'],
    'onsen': ['♨️', '🛁'],
    'shopping': ['🛍️', '💎'],
    'cafe': ['☕', '🍵'],
    'entertainment': ['🎭', '🎬'],
    'nature': ['🌿', '🏞️'],
    'church': ['⛪'],
    'parking': ['🅿️', '🚗'],
    'transport': ['✈️', '🚄'],
    'other': ['📌']
}

# Type keywords (check in order - more specific first)
TYPE_RULES = [
    ('onsen', ['溫泉', 'on', '湯', 'onsen', '入浴']),
    ('hotel', ['酒店', 'hotel', 'inn', '旅館', '住宿']),
    ('restaurant', ['餐廳', '食堂', '蕎麥麵', '蕎麦', '燒肉', 'Omakase', '漢堡扒', '牛肉蓋飯', '卵かけごはん', '烤地瓜', '地瓜片', '檸檬汁', '布丁', '挽肉と米', '和牛', '漢堡扒', 'Roast Beef', '生牛肉飯', '烏冬', 'かに地獄', '肉男', '飯團']),
    ('snack', ['咖哩包', '糰子', '今川燒', '草莓', '半月燒', '咖啡餅', '馬卡龍', '費南雪']),
    ('cafe', ['cafe', '咖啡', 'IKARU', '丸山咖啡']),
    ('temple', ['神社', '寺廟', 'temple', '冰川神社', '日枝大神社', '法輪寺']),
    ('church', ['教堂', 'capelle']),
    ('sightseeing', ['燈塔', '時之鐘', '一番街', '老街', '赤坂', '原宿', '大時計']),
    ('park', ['公園', '庭園', '松鼠園']),
    ('museum', ['博物館', '美術館']),
    ('shopping', ['Outlet', '購物', 'shop', 'Bon Voyage']),
    ('nature', ['森林', '瀑布', '湖', '自然']),
    ('entertainment', ['舞台劇', 'Cafe', '哈利波特', 'Disney']),
]

# Place names that indicate non-place entries (to skip)
SKIP_PATTERNS = [
    'Flight', 'Skyliner', 'Hotel store luggage', 'Train to', 'airport rent car',
    '江之電一日卷', 'Nissan rent-a-car', 'drive from', 'breakfast???',
    'Hotel取行李', 'CX501', 'End', 'Search', 'v$',
    # Transport/notes only rows
    '"Visit Japan" QR Code', '申請國際車牌',
]

# Place names to skip (exact or contains)
SKIP_NAMES = [
    '???', '???', '', '草津',  # just region name in activity column
    '川越',  # just region name
]


def categorize_place(name, area):
    """Categorize a place based on its name and keywords."""
    combined = f"{name} {area}".lower()
    
    for ptype, keywords in TYPE_RULES:
        for kw in keywords:
            if kw.lower() in combined:
                return ptype
    
    # Default
    return 'sightseeing'


def extract_links(row):
    """Extract valid URLs from Web Site columns (H-K, indices 7-10)."""
    links = []
    for i in range(7, 11):
        if len(row) > i and row[i]:
            val = row[i].strip()
            if not val:
                continue
            # Check if it looks like a URL
            if any(val.startswith(prefix) for prefix in ['http://', 'https://', 'www.']):
                if not val.startswith('http'):
                    val = 'https://' + val
                links.append(val)
            elif val in ['Facebook', 'Official IG', 'Blog', 'Table check']:
                # These are labels, not URLs - skip or handle specially
                continue
            else:
                # Could be a partial URL or label, try to include if it looks useful
                links.append(val)
    return list(dict.fromkeys(links))  # deduplicate while preserving order


def clean_name(name):
    """Clean a place name by removing emojis, extra whitespace, and formatting."""
    if not name:
        return ''
    
    # Remove transport/activity emojis at start
    cleaned = name.strip()
    
    # Remove leading emoji characters (✈️🚄🧳🚃🚙🐿️🎭☕️🪄 etc.)
    while cleaned and len(cleaned) > 0:
        first_char = cleaned[0]
        if ord(first_char) > 127:  # Non-ASCII, likely emoji
            cleaned = cleaned.lstrip('\u200d')  # Remove zero-width joiner
            if len(cleaned) > 0 and ord(cleaned[0]) > 127:
                cleaned = cleaned.lstrip('\ufe0f')  # Remove variation selector
            else:
                break
        elif first_char in ['(', ')', ' ', '\t']:
            cleaned = cleaned.strip()
        else:
            break
    
    # Remove line breaks and extra spaces
    cleaned = ' '.join(cleaned.split())
    
    # Remove trailing/leading special markers
    cleaned = cleaned.strip('\n\r\t ')
    
    return cleaned


def clean_notes(notes):
    """Clean notes text."""
    if not notes:
        return ''
    # Remove "Search" suffixes and trailing whitespace
    cleaned = notes.strip()
    return cleaned


def is_place_row(row):
    """Determine if a row contains a real place (not transport/notes)."""
    if len(row) < 3:
        return False
    
    name = row[2]
    if not name or not name.strip():
        return False
    
    cleaned = clean_name(name)
    
    # Skip empty or placeholder names
    if not cleaned:
        return False
    
    # Skip exact skip patterns
    for skip in SKIP_NAMES:
        if cleaned == skip or cleaned.strip() == skip:
            return False
    
    # Skip non-place entries
    for pattern in SKIP_PATTERNS:
        if pattern.lower() in cleaned.lower():
            return False
    
    # Skip rows that are just transport instructions or notes
    if cleaned.startswith('(') and cleaned.endswith(')'):
        return False
    
    # Skip rows that are purely about booking/time info without a place name
    if cleaned.startswith('Booked ') or cleaned.startswith('早啲'):
        return False
    
    # Skip single-word non-place entries
    if cleaned in ['草津', '川越']:
        return False
    
    # Must have some substance - at least 2 chars or contain a Japanese char
    if len(cleaned) < 2:
        return False
    
    return True


def extract_date(row):
    """Extract date string from column A."""
    if len(row) > 0 and row[0]:
        return row[0].strip()
    return None


def extract_area(row):
    """Extract area from column B."""
    if len(row) > 1 and row[1]:
        return row[1].strip()
    return ''


def extract_hours(row):
    """Extract hours/price from column D."""
    if len(row) > 3 and row[3]:
        return row[3].strip()
    return ''


def extract_notes(row):
    """Combine Notes (E) and AI Research Notes (F)."""
    notes = ''
    if len(row) > 4 and row[4]:
        notes += row[4].strip() + '\n'
    if len(row) > 5 and row[5]:
        notes += row[5].strip() + '\n'
    return clean_notes(notes)


def extract_address(row):
    """Extract address from column G."""
    if len(row) > 6 and row[6]:
        return row[6].strip()
    return ''


def main():
    data = SHEET_DATA['values']
    header = data[0]
    
    print(f"Total rows (including header): {len(data)}")
    print(f"Header: {header}")
    
    # Group places by date
    groups = {}  # date -> list of places
    other_places = []
    
    current_date = None
    
    for i, row in enumerate(data[1:], start=2):  # skip header
        if not is_place_row(row):
            date = extract_date(row)
            if date and date.strip():
                current_date = date  # Update current date even for non-place rows
            continue
        
        name = clean_name(row[2])
        area = extract_area(row)
        
        # Try to get date from this row or current context
        date = extract_date(row)
        if not date:
            date = current_date
        
        place_type = categorize_place(name, area)
        
        # Get emoji for type
        emojis = TYPE_EMOJIS.get(place_type, ['📌'])
        emoji = emojis[0]
        
        # For Harry Potter, use magic wand
        if '哈利·波特' in name or 'Harry Potter' in name:
            emoji = '🪄'
        
        place = {
            'id': str(uuid.uuid4()),
            'name': name,
            'emoji': emoji,
            'lat': 0,
            'lng': 0,
            'region': area or 'Unknown',
            'type': place_type,
            'area': area,
            'hours': extract_hours(row),
            'notes': extract_notes(row),
            'ai_notes': '',  # Already merged into notes above
            'address': extract_address(row),
            'links': extract_links(row)
        }
        
        if date:
            if date not in groups:
                groups[date] = []
            groups[date].append(place)
        else:
            other_places.append(place)
    
    # Build groups list in chronological order + "其他" at end
    result_groups = []
    
    # Sort dates chronologically (simple sort works for this format)
    sorted_dates = sorted(groups.keys(), key=lambda d: _date_sort_key(d))
    
    for date in sorted_dates:
        places = groups[date]
        # Determine group emoji and name from first place's area or date
        first_place = places[0]
        
        # Build group name from date
        group_name = f"{date}"
        
        # Determine emoji based on area (if all same) or use calendar
        areas = set(p['area'] for p in places if p['area'])
        if len(areas) == 1 and areas:
            area = list(areas)[0]
            # Choose emoji based on dominant place type in this group
            types = [p['type'] for p in places]
            dominant_type = max(set(types), key=types.count)
            emoji = TYPE_EMOJIS.get(dominant_type, ['📅'])[0]
            group_name = f"{date} - {area}"
        else:
            emoji = '📅'
        
        result_groups.append({
            'id': str(uuid.uuid4()),
            'name': group_name,
            'emoji': emoji,
            'collapsed': False,
            'places': places
        })
    
    # Add "其他" group for unassigned places
    if other_places:
        result_groups.append({
            'id': str(uuid.uuid4()),
            'name': '其他 (未安排)',
            'emoji': '📌',
            'collapsed': True,
            'places': other_places
        })
    
    # Build final output
    output = {
        '_meta': {
            'version': '1.0',
            'planName': '日本旅行 2026',
            'lastSaved': datetime.now().isoformat()
        },
        'groups': result_groups
    }
    
    # Print summary
    total_places = sum(len(g['places']) for g in result_groups)
    print(f"\nTotal places extracted: {total_places}")
    print(f"Groups created: {len(result_groups)}")
    
    for g in result_groups:
        print(f"\n  Group: {g['name']} ({len(g['places'])} places)")
        for p in g['places']:
            print(f"    - {p['emoji']} {p['name']} [{p['type']}] ({p['area']})")
    
    # Write JSON file
    output_path = '/Users/cheung/repos/travel-planner/import.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ JSON written to: {output_path}")


def _date_sort_key(date_str):
    """Convert date string to sortable key."""
    if not date_str:
        return ''
    
    # Try various formats
    import re
    
    # Format like "31/10月/2026 (週六)" or "01/11月/2026 (週日)"
    match = re.match(r'(\d{1,2})/(\d{1,2})月/(\d{4})', date_str)
    if match:
        day, month, year = int(match.group(1)), int(match.group(2)), int(match.group(3))
        return f"{year:04d}-{month:02d}-{day:02d}"
    
    # Format like "31/10"
    match = re.match(r'(\d{1,2})/(\d{1,2})', date_str)
    if match:
        return f"2026-{int(match.group(2)):02d}-{int(match.group(1)):02d}"
    
    return date_str


if __name__ == '__main__':
    main()
