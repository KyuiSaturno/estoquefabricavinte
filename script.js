// Mantenha aqui a sua URL do Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];        
let indicesImagens = {};  

// ==========================================
// CONTROLADOR DE NAVEGAÇÃO
// ==========================================
function alternarAba(abaDestino) {
    const abaProdutos = document.getElementById("aba-produtos");
    const btnProdutos = document.getElementById("btn-aba-produtos");
    if (abaProdutos) abaProdutos.classList.remove("escondido");
    if (btnProdutos) btnProdutos.classList.add("ativa");
}

// ==========================================
// CARROSSEL E IMAGENS
// ==========================================
function mudarFoto(idUnicoControle, totalFotos, direcao) {
    let indexAtual = indicesImagens[idUnicoControle] || 0;
    indexAtual = (indexAtual + direcao + totalFotos) % totalFotos;
    indicesImagens[idUnicoControle] = indexAtual;

    const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
    const imagens = carrosselDiv.querySelectorAll("img");
    imagens.forEach((img, i) => img.classList.toggle("ativa", i === indexAtual));
}

// ==========================================
// LÓGICA DE PRODUTOS
// ==========================================
function renderizarProdutos(listaProdutos, containerId, prefixoContexto, usarEstoquePromo) {
    const listaDiv = document.getElementById(containerId);
    listaDiv.innerHTML = "";

    listaProdutos.forEach(produto => {
        const idUnico = `${prefixoContexto}-${produto.id}`;
        indicesImagens[idUnico] = 0;
        const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
        
        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnico}">
                ${produto.imagens ? produto.imagens.map((url, i) => `<img src="${url}" class="${i===0?'ativa':''}">`).join('') : '<img src="https://placehold.co/400x400?text=Sem+Foto" class="ativa">'}
                <button class="btn-carrossel btn-prev" onclick="mudarFoto('${idUnico}', ${produto.imagens?.length || 1}, -1)">&#10094;</button>
                <button class="btn-carrossel btn-next" onclick="mudarFoto('${idUnico}', ${produto.imagens?.length || 1}, 1)">&#10095;</button>
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                <select id="cor-${idUnico}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                    ${Object.keys(mapaEstoque).map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <p class="estoque-status">Estoque: <span id="status-${idUnico}">${Object.values(mapaEstoque)[0]}</span> un.</p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">Selecionar Peça</button>
            </div>
        `;
        listaDiv.appendChild(cartao);
    });
}

function atualizarStatusEstoque(produtoId, prefixoContexto, usarEstoquePromo) {
    const idUnico = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => p.id === produtoId);
    const cor = document.getElementById(`cor-${idUnico}`).value;
    const qtd = (usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor)[cor] || 0;
    document.getElementById(`status-${idUnico}`).innerText = qtd;

    // Troca de imagem por cor (se existir mapeamento)
    if (produto.imagemPorCor && produto.imagemPorCor[cor]) {
        const carrosselDiv = document.getElementById(`carrossel-${idUnico}`);
        const imagens = carrosselDiv.querySelectorAll("img");
        imagens.forEach((img, i) => {
            if (img.src === produto.imagemPorCor[cor]) {
                imagens.forEach(img => img.classList.remove("ativa"));
                img.classList.add("ativa");
                indicesImagens[idUnico] = i;
            }
        });
    }
}

// ==========================================
// CARRINHO E TRANSMISSÃO
// ==========================================
function toggleCarrinhoMobile() {
    document.getElementById("carrinho-gaveta").classList.toggle("aberto");
}

function adicionarAoCarrinho(produtoId, prefixoContexto, usarEstoquePromo) {
    const produto = dadosProdutosFiltrados.find(p => p.id === produtoId);
    const cor = document.getElementById(`cor-${prefixoContexto}-${produtoId}`).value;
    const max = (usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor)[cor];

    const exist = carrinho.find(i => i.id === produtoId && i.cor === cor && i.promo === usarEstoquePromo);
    if (exist) {
        if (exist.qtd < max) exist.qtd++;
        else alert("Limite de estoque atingido.");
    } else {
        carrinho.push({ id: produtoId, nome: produto.nome, cor, qtd: 1, max, promo: usarEstoquePromo, cat: document.getElementById("filtro-categoria").value });
    }
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const badge = document.getElementById("badge-contador-carrinho");
    badge.innerText = carrinho.reduce((s, i) => s + i.qtd, 0);
    container.innerHTML = carrinho.length === 0 ? '<p class="carrinho-vazio">Nenhum item selecionado.</p>' : '';
    
    carrinho.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "item-carrinho-linha";
        div.innerHTML = `<div>${item.nome} (${item.cor})</div><div>${item.qtd} un.</div><button onclick="removerDoCarrinho(${index})">X</button>`;
        container.appendChild(div);
    });
    const btn = document.getElementById("btn-confirmar");
    if(btn) btn.disabled = carrinho.length === 0;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

async function confirmarBaixa() {
    const btn = document.getElementById("btn-confirmar");
    btn.innerText = "Enviando...";
    // Adicione aqui sua lógica de loop fetch...
    alert("Transmissão realizada!");
    carrinho = [];
    atualizarInterfaceCarrinho();
    toggleCarrinhoMobile();
}
