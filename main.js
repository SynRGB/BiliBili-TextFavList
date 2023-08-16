// ==UserScript==
// @name                BiliBili-TextFavList
// @name:zh-CN          BiliBili-文字收藏夹列表
// @namespace           https://github.com/Mehver
// @version             bata
// @description         (Thanks to ZEP's paid customization) Display Bilibili favourite list results in a text list, which is convenient for sorting by each column.
// @description:zh-CN   (感谢闲鱼买家ZEP的有偿定制) 用纯文字列表的方式展示B站收藏夹结果，方便按各列排序。
// @sponsor             ZEP
// @author              https://github.com/Mehver
// @icon
// @match               http*://space.bilibili.com/*/favlist*
// @exclude             http*://space.bilibili.com/*/favlist*ctype*
// @license             MPL-2.0
// @license^            Mozilla Public License 2.0
// @charset		        UTF-8
// @homepageURL         https://github.com/SynRGB/BiliBili-TextFavList
// @contributionURL     https://github.com/SynRGB/BiliBili-TextFavList
// @copyright           Copyright © 2022-PRESENT, Mehver (https://github.com/Mehver)
// @grant               GM_addStyle
// @grant               GM_getResourceText
// @grant               GM_getValue
// @grant               GM_setValue
// @grant               GM_registerMenuCommand
// @resource            DataTablesCSS https://cdn.datatables.net/1.11.3/css/jquery.dataTables.min.css
// ==/UserScript==

let table_font_size = await GM_getValue('table_font_size', 16);
let network_delay = await GM_getValue('network_delay', 400);

GM_registerMenuCommand('设置表格字体大小', async () => {
    let newFontSize = prompt('请输入新的字体大小（单位px）:', table_font_size);
    if (newFontSize) {
        table_font_size = newFontSize;
        await GM_setValue('table_font_size', table_font_size);
        alert('字体大小已更新！请刷新页面以查看更改。');
    }
});

GM_registerMenuCommand('设置脚本加载时延', async () => {
    let newNetworkDelay = prompt('脚本依赖外部组件，对于不同的网络环境和电脑性能，\n组件加载速度也不同。如果出现显示错误、白屏等BUG，\n可以适度调高这个数字确保外部引入的组件完成加载。\n默认400（单位ms）:', network_delay);
    if (newNetworkDelay) {
        network_delay = newNetworkDelay;
        await GM_setValue('network_delay', network_delay);
        alert('脚本加载时延已更新！请刷新页面以查看更改。');
    }
});

//////////////////////////////////////
//////////// DataTables //////////////
let cssTxt = GM_getResourceText("DataTablesCSS");
GM_addStyle(cssTxt);
let head = document.head || document.getElementsByTagName('head')[0];
let link = document.createElement('link');
link.type = 'text/css';
link.rel = 'stylesheet';
link.href = 'https://cdn.datatables.net/1.11.3/css/jquery.dataTables.min.css';
head.appendChild(link);
(function() {
    let jQueryScript = document.createElement("script");
    jQueryScript.src = "https://code.jquery.com/jquery-3.6.0.min.js";
    jQueryScript.onload = () => {
        let dtScript = document.createElement("script");
        dtScript.src = "https://cdn.datatables.net/1.11.3/js/jquery.dataTables.min.js";
        // 加载完成后首次运行
        dtScript.onload = () => {
            main();
        };
        document.body.appendChild(dtScript);
    };
    document.body.appendChild(jQueryScript);
})();
//////////// DataTables //////////////
//////////////////////////////////////

//////////////////////////////////////
/////////////// 触发器 ////////////////
// 延时避免在 dtScript 和 jQueryScript 加载完成前就运行
setTimeout(function() {
    setTimeout(function() {
        main();
    }, network_delay / 2);
    let observerElement = new window.MutationObserver(function() {
        setTimeout(function() {
            main();
        }, network_delay / 3);
    });
    // 收藏夹切换触发
    let targetForObserver1 = document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.favList-info');
    if (targetForObserver1) {
        observerElement.observe(targetForObserver1, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }
    // 手动选择分区或收藏时间
    let targetElement2 = document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-header.fav-header-info > div > div');
    if (targetElement2) {
        targetElement2.addEventListener('click', function() {
            setTimeout(function() {
                main();
            }, network_delay / 2);
        });
    }
    // 翻页触发
    let targetElement3 = document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-content.section > ul.be-pager');
    if (targetElement3) {
        targetElement3.addEventListener('click', function() {
            setTimeout(function() {
                main();
            }, network_delay / 2);
        });
    }
    // 搜索触发
    let targetElement4 = document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-header.fav-header-info > div > div > div.filter-item.search');
    if (targetElement4) {
        targetElement4.addEventListener('click', function() {
            setTimeout(function() {
                main();
            }, network_delay * 2);
        });
    }
    // 订阅等其他类型的收藏夹，点击后应避免脚本生效
    let excludeElement1 = document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-sidenav > div:nth-child(2)');
    if (excludeElement1) {
        excludeElement1.addEventListener('click', function() {
            setTimeout(function() {
                revert_main();
            }, network_delay / 2);
        });
    }
    let excludeElement2 = document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-sidenav > div:nth-child(3)');
    if (excludeElement2) {
        excludeElement2.addEventListener('click', function() {
            setTimeout(function() {
                revert_main();
            }, network_delay / 2);
        });
    }
}, network_delay * 2);
/////////////// 触发器 ////////////////
//////////////////////////////////////

/////////////////////////////////////
/////////////// main ////////////////
function revert_main() {
    try {
        // 隐藏列表
        try { document.querySelector('#biliResultsTable').style.display = 'none'; } catch (e) {}
        // 显示收藏夹
        try { document.querySelector("#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-content.section > ul.fav-video-list.clearfix.content").style.display = 'block'; } catch (e) {}
    } catch (e) {
        console.log(e);
    }
}
function main() {
    try {
        // 隐藏”批量操作“按钮
        try { document.querySelector('#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-header.fav-header-info > div > div > div.filter-item.do-batch').style.display = 'none'; } catch (e) {}
        // 隐藏收藏夹
        try { document.querySelector("#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-content.section > ul.fav-video-list.clearfix.content").style.display = 'none'; } catch (e) {}

        // Create table with thead for DataTables
        let table = document.createElement('table');
        table.id = "biliResultsTable";
        let thead = document.createElement('thead');
        let tbody = document.createElement('tbody');
        let header = ["收藏于", "时长", "标题"];
        let trHead = document.createElement('tr');
        header.forEach(text => {
            let th = document.createElement('th');
            th.textContent = text;
            trHead.appendChild(th);
        });
        thead.appendChild(trHead);

        setTimeout(function() {
            let videoCards = document.querySelectorAll('li');
            videoCards.forEach(videoCard => {
                let title;
                let length;
                let pubdate;

                try {
                    title = videoCard.querySelector('a.title')?.textContent.trim();
                    length = videoCard.querySelector('span.length')?.textContent.trim();
                    pubdate = videoCard.querySelector('div.meta.pubdate')?.textContent.trim().replace('收藏于： ', '');
                    // let link_video = videoCard.querySelectorAll('a')[0].getAttribute('href');
                } catch (e) {}

                let tr = document.createElement('tr');

                // 确保没有为空的数据
                if (
                    (title !== undefined) &&
                    (length !== undefined) &&
                    (pubdate !== undefined)
                    // (link_video !== undefined)
                ) {
                    [pubdate, length, title].forEach(text => {
                        let td = document.createElement('td');
                        td.textContent = text;
                        tr.appendChild(td);
                    });
                    // let tdTitle = tr.querySelector('td:nth-child(3)');
                    // tdTitle.innerHTML = `<a href="${link_video}" target="_blank">${title}</a>`;
                    // b230815.02 时长加粗
                    tr.querySelector('td:nth-child(2)').style.fontWeight = 'bold';
                    // b230815.02 标题用 `#00AEEC` 颜色
                    tr.querySelector('td:nth-child(3)').style.color = '#00AEEC';
                    tbody.appendChild(tr);
                }
            });
            table.appendChild(thead);
            table.appendChild(tbody);

            // 回调获取异步数据，适用于异步加载
            if (tbody.childElementCount === 0) {
                main();
                return;
            }

            let tables = document.querySelectorAll('#biliResultsTable');
            if (tables.length === 0) {
                let targetDiv_bott = document.querySelector("#page-fav > div.col-full.clearfix.master > div.fav-main.section > div.fav-content.section > ul.be-pager");
                targetDiv_bott.parentNode.insertBefore(table, targetDiv_bott);
            } else {
                tables[0].parentNode.replaceChild(table, tables[0]);
            }


            // DataTables 的自定义排序算法
            $.fn.dataTable.ext.type.order['length-sort-pre'] = function (d) {return convertLength(d);};
            $.fn.dataTable.ext.type.order['pubdate-sort-pre'] = function (d) {return convertPubDate(d);};
            // Initialize DataTables
            $(table).DataTable({
                "paging": false,
                "searching": false,
                "info": false,
                "columnDefs": [
                    { "type": "length-sort", "targets": 1 },
                    { "type": "pubdate-sort", "targets": 0 }
                ]
            });

            // b230815.02 去掉底边横线
            GM_addStyle("table.dataTable.no-footer { border-bottom: 0px none !important; }");
            // b230815.02 去掉表头横线 (因CSS复杂，所以创建白色色块覆盖)
            GM_addStyle(".dataTable thead th { border-bottom: 0px none !important; }");
            // b230815.02 调大字号
            GM_addStyle(`.dataTable { font-size: ${table_font_size}px !important; }`);
            // 左侧留30px空白
            GM_addStyle(`.dataTable { margin-left: 30px !important; }`);
        }, 100);
    } catch (e) {
        console.log(e);
    }
}
/////////////// main ////////////////
/////////////////////////////////////

///////////////////////////////////
/////// DataTable 的排序算法 ////////
function convertLength(duration) {
    let parts = duration.split(':').map(part => parseInt(part, 10));
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    } else {
        return NaN;
    }
}
function convertPubDate(date) {
    const now = new Date();
    if (date.includes('刚刚')) {
        return now.getTime();
    }
    if (date.includes('小时前')) {
        const hoursAgo = parseFloat(date.replace('小时前', ''));
        return now - hoursAgo * 3600 * 1000; // Convert hours to milliseconds
    }
    if (date === "昨天") {
        return now - 24 * 3600 * 1000; // 24 hours in milliseconds
    }
    if (date.includes('-')) {
        const parts = date.split('-').map(part => {
            return part.padStart(2, '0');
        });
        // If only month and day are given, use the current year.
        if (parts.length === 2) {
            parts.unshift(now.getFullYear().toString());
        }
        // Create a new Date object and return its time value in milliseconds
        return new Date(parts.join('-')).getTime();
    }
}
/////// DataTable 的排序算法 ////////
///////////////////////////////////

console.log("JS script BiliBili-TextFavList (BiliBili-文字收藏夹列表) loaded. See more details at https://github.com/SynRGB/BiliBili-TextFavList");

