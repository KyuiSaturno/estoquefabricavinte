// Mantenha aqui a sua URL do Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais
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

    if (abaDestino === 'produtos' || abaDestino === 'inicio') {
        if (abaProdutos) abaProdutos.classList.remove("escondido");
        if (btnProdutos) btnProdutos.classList.add("ativa");
    }
}

// ==========================================
// LOGIN E INICIALIZAÇÃO
// ==========================================
async function fazerLogin() {
    const usuarioInput = document.getElementById("usuario").value.trim();
    const senhaInput = document.getElementById("senha").value.trim();
    const erroLogin = document.getElementById("erro-login");
    const btnLogin = document.getElementById("btn-login");

    if (!usuarioInput || !senhaInput) {
        erroLogin.innerText = "Preencha todos os campos.";
        return;
    }

    btnLogin.innerText = "Verificando...";
    btnLogin.disabled = true;
    erroLogin.innerText = "";

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "login", usuario: usuarioInput, senha: senhaInput }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            
            const elOperadorPc = document.getElementById("nome-operador-pc");
            const elOperadorMobile = document.getElementById("nome-operador-mobile");
            
            if (elOperadorPc) elOperadorPc.innerText = `Usuário: ${usuarioLogado}`;
            if (elOperadorMobile) elOperadorMobile.innerText = usuarioLogado;
            
            document.getElementById("tela-login").classList.add("escondido");
            document.getElementById("painel-principal").classList.remove("escondido");
            
            alternarAba('produtos');
            carregarCategoriasDinamicas();
        } else {
            erroLogin.innerText = resultado.erro || "Usuário ou senha incorretos.";
            btnLogin.innerText = "Entrar";
            btnLogin.disabled = false;
        }
    } catch (erro) {
        erroLogin.innerText = "Erro ao conectar com o servidor.";
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

// ==========================================
// CARREGAMENTO E FILTRAGEM
// ==========================================
async function carregarCategoriasDinamicas() {
    const seletor = document.getElementById("filtro-categoria");
    if (!seletor) return;

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterAbas" }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();
        if (resultado.sucesso) {
            seletor.innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
            resultado.abas.forEach(aba => {
                const opcao = document.createElement("option");
                opcao.value = aba;
                opcao.innerText = aba;
                seletor.appendChild(opcao);
            });
        }
    } catch (erro) { console.error(erro); }
}

async function filtrarPorCategoria() {
    const categoriaSelecionada = document.getElementById("filtro-categoria").value;
    const containerFiltrados = document.getElementById("lista-produtos-filtrados");

    if (!categoriaSelecionada) {
        containerFiltrados.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima.</p>';
        return;
    }

    containerFiltrados.innerHTML = '<p class="carrinho-vazio">Carregando estoque...</p>';

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterProdutos", tipo: categoriaSelecionada }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();
        if (resultado.sucesso) {
            dadosProdutosFiltrados = resultado.produtos;
            aplicarFiltroVisual();
        }
    } catch (erro) {
        containerFiltrados.innerHTML = '<p class="carrinho-vazio">Erro de conexão.</p>';
    }
}

function aplicarFiltroVisual() {
    const apenasPromocionais = document.getElementById("filtro-promocional")?.checked;
    const lista = apenasPromocionais ? 
        dadosProdutosFiltrados.filter(p => p.estoquePromocional && Object.values(p.estoquePromocional).some(qtd => qtd > 0)) : 
        dadosProdutosFiltrados;
    
    renderizarProdutos(lista, "lista-produtos-filtrados", "produtos", apenasPromocionais);
}

// ==========================================
// RENDERIZAÇÃO E INTERAÇÃO
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
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                <select id="cor-${idUnico}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                    ${Object.keys(mapaEstoque).map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <p class="estoque-status">Estoque: <span id="status-${idUnico}">${Object.values(mapaEstoque)[0]}</span> un.</p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">Adicionar à Transmissão</button>
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
    
    document.getElementById("btn-confirmar").disabled = carrinho.length === 0;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

async function confirmarBaixa() {
    const btn = document.getElementById("btn-confirmar");
    btn.innerText = "Enviando...";
    
    // Lógica de envio fetch para o WEB_APP_URL...
    // (Mantenha sua lógica de loop de baixa aqui)
    alert("Transmissão realizada!");
    carrinho = [];
    atualizarInterfaceCarrinho();
    toggleCarrinhoMobile();
}
