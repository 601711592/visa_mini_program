"""静态组件 CSS 几何对照，不是 Vue/uni-app 运行时或微信真机测试。"""
from pathlib import Path
import re, json, base64, io, os, shutil
from PIL import Image
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
S=json.loads((ROOT/'src/mall/design-icon-source.json').read_text())
module=(ROOT/'src/mall/design-icons.ts').read_text()
PNGS=json.loads(re.search(r'const rasters: Record<string, string> = (.*?);\n', module, re.S).group(1))
PNGS={k:re.sub(r'~(\d+)~',lambda m:'W3ok'*int(m.group(1)),v) for k,v in PNGS.items()}
def png(name,size):
    return f'<img class="mall-icon" alt="" src="{PNGS[S["aliases"].get(name,name)]}" style="width:{size}rpx;height:{size}rpx;display:inline-block;flex-shrink:0;vertical-align:middle">'
def svg(name,size):
    body=S['paths'][S['aliases'].get(name,name)]
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}rpx" height="{size}rpx" viewBox="0 0 24 24" fill="none" stroke="#245B7A" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">{body}</svg>'
def styles():
    out=(ROOT/'src/mall/theme.scss').read_text()
    for relative in [*(f'src/components/mall/{name}.vue' for name in ['ProfileHeader','OrderShortcuts','BenefitRow','ServiceList','CatalogCards','CouponCard','MallIcon','CatalogNav','ProductLine','PriceBreakdown']), 'src/pages/account/index.vue', 'src/pages/category/index.vue', 'src/pagesMall/orders/index.vue', 'src/pagesMall/order/index.vue']:
        p = ROOT / relative
        out+='\n'+'\n'.join(re.findall(r'<style[^>]*>(.*?)</style>',p.read_text(),re.S))
    out=re.sub(r':deep\(([^)]+)\)',r'\1',out)
    out=re.sub(r'\bimage\b(?=[\s.{:#>])','img',out)
    out=re.sub(r'(?<=[\s>])text(?=[\s.{:#>])','span',out)
    return out
RESET='*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#f4f6fa;color:#202631}button{font:inherit;color:inherit;border:0;background:none;padding:0;text-align:inherit}button::after{border:0}button{cursor:pointer}img{object-fit:contain}svg{flex-shrink:0} .native{height:110rpx;background:#8ad0f9;display:flex;align-items:center;justify-content:center;font-size:36rpx;font-weight:600;color:#164e70}.fixture{width:750rpx;min-height:1500rpx;position:relative;background:#f4f6fa}.fixture-note{padding:16px;font-size:12px;background:white;color:#495566}.avatar-mask{background:#eaf6fd!important} .fixture .profile-header__reference{background-image:none}'
REF='''
.hero{height:398rpx;background:#8ad0f9;border-radius:0 0 24rpx 24rpx;color:#164e70}.profile{position:absolute;top:130rpx;left:42rpx;right:40rpx;display:flex;align-items:center;gap:24rpx;width:668rpx}.avatar{flex:none;width:150rpx;height:150rpx;border-radius:50%;border:2rpx solid white;background:#eaf6fd}.identity{display:flex;flex-direction:column;gap:10rpx;flex:1}.identity strong{font-size:42rpx;font-weight:600}.identity>span{font-size:30rpx}main{position:relative;margin-top:-93rpx;padding:0 24rpx 160rpx}.card{background:white;border-radius:24rpx;margin-bottom:20rpx}.orders{height:258rpx;padding:30rpx 26rpx}.section-title{display:flex;justify-content:space-between;align-items:center}h2{font-size:34rpx;margin:0;font-weight:600}.all{display:flex;align-items:center;font-size:27rpx;color:#737d8c;min-height:48rpx}.order-grid{display:grid;grid-template-columns:repeat(4,1fr);margin-top:30rpx}.order-grid button{display:flex;flex-direction:column;align-items:center;gap:20rpx;font-size:28rpx;font-weight:500;min-height:126rpx}.benefits{padding:0 28rpx}.benefit{height:150rpx;display:flex;align-items:center;gap:12rpx;border-bottom:1.5rpx solid #e3e8f0}.benefit:last-child{border:0}.detail{display:flex;align-items:center;gap:26rpx;flex:1;min-width:0;height:100%}.detail>span{min-width:0}.detail strong{display:block;font-weight:500;font-size:32rpx;margin-bottom:8rpx}.description{display:flex;align-items:center;white-space:nowrap;font-size:25rpx;color:#737d8c;line-height:1.5}.detail-link{display:inline-flex;align-items:center;color:#164e70}.pill{flex:none;background:#eaf6fd;color:#164e70;border-radius:40rpx;width:172rpx;min-height:66rpx;display:flex;align-items:center;justify-content:center;font-size:28rpx;font-weight:500}.services{padding:0 28rpx}.services button{height:124rpx;display:flex;align-items:center;gap:26rpx;width:100%;border-bottom:1.5rpx solid #e3e8f0;font-size:30rpx;font-weight:500}.services button:last-child{border:0}.services button>span{flex:1}
'''
ENTRIES=[('wallet','待付款'),('order','办理中'),('check','已完成'),('refund','售后退款')]
BENEFITS=[('points','积分中心','当前积分 1280','明细','去使用'),('coupon','优惠券','2 张可用','查看全部','去使用'),('invite','邀请好友','查看邀请记录与奖励规则','','去邀请')]
SERVICES=[('address','收货地址管理'),('map','我司地图定位')]
def reference():
    h='<header class="hero"><div class="native">个人中心</div><button class="profile"><span class="avatar"></span><span class="identity"><strong>张女士</strong><span>138****6688</span></span>'+svg('chevron',38)+'</button></header><main>'
    h+='<section class="card orders"><div class="section-title"><h2>我的订单</h2><button class="all">查看全部'+svg('chevron',30)+'</button></div><div class="order-grid">'
    h+=''.join('<button>'+svg(i,54)+'<span>'+t+'</span></button>' for i,t in ENTRIES)+'</div></section><section class="card benefits">'
    for i,t,v,l,a in BENEFITS:
        h+='<div class="benefit"><button class="detail">'+svg(i,44)+'<span><strong>'+t+'</strong><span class="description">'+v+('<span class="detail-link"> · '+l+svg('chevron',25)+'</span>' if l else '')+'</span></span></button><button class="pill">'+a+'</button></div>'
    return h+'</section><section class="card services">'+''.join('<button>'+svg(i,44)+'<span>'+t+'</span>'+svg('chevron',32)+'</button>' for i,t in SERVICES)+'</section></main>'
def implementation():
    h='<div class="native">个人中心</div><div class="profile-header"><button class="profile-header__trigger"><div class="profile-header__avatar avatar-mask"></div><div class="profile-header__identity"><div class="profile-header__name">张女士</div><div class="profile-header__phone">138****6688</div></div>'+png('chevron',38)+'</button></div><div class="account-body">'
    h+='<div class="order-shortcuts"><div class="order-shortcuts__heading"><div class="order-shortcuts__title">我的订单</div><button class="order-shortcuts__all"><span>查看全部</span>'+png('chevron',30)+'</button></div><div class="order-shortcuts__grid">'
    h+=''.join('<button class="order-shortcuts__item">'+png(i,54)+'<span>'+t+'</span></button>' for i,t in ENTRIES)+'</div></div><div class="account-benefits">'
    for i,t,v,l,a in BENEFITS:
        h+='<div class="benefit-row"><button class="benefit-main">'+png(i,44)+'<div class="benefit-copy"><div class="benefit-title">'+t+'</div><div class="benefit-description"><span>'+v+'</span>'+('<span class="benefit-link"> · '+l+'</span>'+png('chevron',25) if l else '')+'</div></div></button><button class="benefit-action"><span class="benefit-pill">'+a+'</span></button></div>'
    return h+'</div><div class="service-list">'+''.join('<button class="service-list__row">'+png(i,44)+'<span class="service-list__label">'+t+'</span>'+png('chevron',32)+'</button>' for i,t in SERVICES)+'</div></div>'
def category():
    cards=''
    for name,price in [('美国旅游签证 · 专业办理','1299.00'),('日本单次旅游签证','699.00')]:
        cards+='<div class="catalog-card"><div class="catalog-card__image" style="background:#eaf6fd"></div><div class="catalog-card__name">'+name+'</div><div class="catalog-card__bottom"><div class="catalog-card__price"><span class="catalog-card__currency">¥</span>'+price+'</div><button class="catalog-card__cart">'+png('cart',46)+'</button></div></div>'
    return '<div class="native">产品分类 · 导航区域不参与测量</div><div class="category-layout"><div class="category-side"><button class="category-link active">签证服务</button><button class="category-link">定制旅游</button></div><div class="category-products"><div class="catalog-cards catalog-cards--category">'+cards+'</div></div></div>'
def coupon():
    return '<div class="native">我的优惠券</div><div class="mx-tabs"><button class="mx-tab active">未使用</button><button class="mx-tab">已使用</button><button class="mx-tab">已过期</button></div><div class="mx-body"><div class="coupon-card"><div class="coupon-face"><div class="coupon-amount"><span>¥</span>50</div><div class="coupon-threshold">满 1000 元可用</div></div><div class="coupon-copy"><div class="coupon-title">签证满减券</div><div class="coupon-meta">签证服务 · 2026-10-31 到期</div><div class="coupon-actions"><div class="mx-actions"><button class="mx-button mx-plain">使用规则 ›</button><button class="mx-button mx-light">去使用</button></div></div></div></div></div>'
def page(width,body,css):
    doc='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+RESET+css+'</style><div class="fixture">'+body+'</div></html>'
    return re.sub(r'(-?\d*\.?\d+)rpx',lambda m:f'{float(m[1])*width/750:.6f}px',doc)

def run():
    out=ROOT/'qa';out.mkdir(exist_ok=True)
    comparisons=[]
    mapping={'.profile-header__avatar':'.avatar','.order-shortcuts':'.orders','.account-benefits':'.benefits','.service-list':'.services','.benefit-title':'.detail strong','.benefit-pill':'.pill','.order-shortcuts__title':'h2'}
    with sync_playwright() as p:
        executable = os.getenv('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser')
        browser=p.chromium.launch(**({'executable_path':executable} if executable else {}),headless=True,args=['--no-sandbox'])
        for width in [320,375,390,430]:
            pages=[]
            for kind,body,css in [('reference',reference(),REF),('account',implementation(),styles()),('category',category(),styles()),('coupons',coupon(),styles())]:
                html=page(width,body,css); (out/f'{kind}-{width}.html').write_text(html)
                tab=browser.new_page(viewport={'width':width,'height':844},device_scale_factor=2)
                tab.set_content(html);tab.wait_for_timeout(50)
                overflow=tab.evaluate('document.documentElement.scrollWidth>innerWidth')
                assert not overflow,(kind,width,'horizontal overflow')
                tab.screenshot(path=str(out/f'{kind}-{width}.png'),full_page=True)
                pages.append(tab)
            ref,actual,cat,cp=pages
            for a,b in mapping.items():
                aa=actual.locator(a).first.bounding_box(); bb=ref.locator(b).first.bounding_box()
                # 文本边界受 line-height 影响；卡片/头像/胶囊严格测量几何。
                fields=['width','height','x','y'] if a not in ['.benefit-title','.order-shortcuts__title'] else ['x']
                delta={k:round(abs(aa[k]-bb[k]),3) for k in fields}
                assert max(delta.values()) < 0.25, (width,a,delta)
                comparisons.append({'width':width,'selector':a,'delta_px':delta})
            assert abs(cat.locator('.category-side').bounding_box()['width']-152*width/750)<.2
            assert abs(cp.locator('.coupon-face').bounding_box()['width']-176*width/750)<.2
            for t in pages:t.close()
        browser.close()
    report={'scope':'Chromium 静态组件 CSS 几何夹具；非 Vue/uni-app 编译运行。头像照片及原生导航不作像素验收。','comparisons':comparisons}
    (out/'visual-metrics.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
    print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':run()
