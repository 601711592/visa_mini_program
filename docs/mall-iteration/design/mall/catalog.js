const Page = {
  render() {
    const products = inventory.map((goods, id) => ({ ...goods, id })).filter(goods => goods.category === s.category);
    const html = `<div class="catalog-page catalog-reference"><div class="catalog-split">
      <aside class="catalog-rail" aria-label="产品分类">${categories.map(category => `<button aria-pressed="${s.category === category}" class="${s.category === category ? 'active' : ''}" data-action="category:${esc(category)}">${esc(category)}</button>`).join('')}</aside>
      <section class="catalog-results-pane" aria-label="${esc(s.category)}">
        <div class="catalog-heading"><h2>${esc(s.category)}</h2><p>${products.length}款商品</p></div>
        <div class="catalog-tiles">${products.map(goods => `<article class="catalog-tile">
          <button class="catalog-goods" data-action="goods:${goods.id}">${cover({ goodsId: goods.id })}<h3>${esc(goods.name)}</h3></button>
          <div class="tile-bottom"><span class="tile-price">¥<strong>${goods.price}</strong></span><button class="tile-cart" data-action="goods:${goods.id}" aria-label="选择${esc(goods.name)}的规格">${icon('chevron-right')}</button></div>
        </article>`).join('')}</div>
      </section>
    </div></div>`;
    mountCommerce(html);
  },
  click(action, value) {
    if (action === 'category') { s.category = value; render(); }
  }
};
if (Preview.guard()) render();
