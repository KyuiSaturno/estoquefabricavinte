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
            document.getElementById("nome-operador-pc").innerText = `Usuário: ${usuarioLogado}`;
            document.getElementById("nome-operador-mobile").innerText = usuarioLogado;
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
        erroLogin.innerText = "Erro ao conectar.";
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

// ==========================================
// CARREGAMENTO E FILTRAGEM
// ==========================================
async function carregarCategoriasDinamicas() {
    const seletor = document.getElementById("filtro-categoria");
    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterAbas" }));
        const resposta = await fetch(WEB_APP_URL, { method: "POST", body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
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
    } catch (e) { console.error(e); }
}

async function filtrarPorCategoria() {
    const categoria = document.getElementById("filtro-categoria").value;
    const container = document.getElementById("lista-produtos-filtrados");
    if (!categoria) return;
    container.innerHTML = 'Carregando...';
    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({ acao: "obterProdutos", tipo: categoria }));
        const resposta = await fetch(WEB_APP_URL, { method: "POST", body: params, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
        const resultado = await resposta.json();
        if (resultado.sucesso) {
            dadosProdutosFiltrados = resultado.produtos;
            aplicarFiltroVisual();
        }
    } catch (e) { container.innerHTML = 'Erro de conexão.'; }
}

function aplicarFiltroVisual() {
    const promo = document.getElementById("filtro-promocional")?.checked;
    const lista = promo ? dadosProdutosFiltrados.filter(p => p.estoquePromocional && Object.values(p.estoquePromocional).some(q => q > 0)) : dadosProdutosFiltrados;
    renderizarProdutos(lista, "lista-produtos-filtrados", "produtos", promo);
}

// ==========================================
// RENDERIZAÇÃO E CARRINHO
// ==========================================
function renderizarProdutos(lista, containerId, prefixo, usarPromo) {
    const container = document.getElementById(containerId);
    container.innerHTML = "";
    lista.forEach(p => {
        const idUnico = `${prefixo}-${p.id}`;
        const estoque = usarPromo ? p.estoquePromocional : p.estoquePorCor;
        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnico}"><img src="${p.imagens ? p.imagens[0] : ''}" class="ativa"></div>
            <div class="info-produto">
                <h3>${p.nome}</h3>
                <select id="cor-${idUnico}" onchange="atualizarStatusEstoque('${p.id}', '${prefixo}', ${usarPromo})">
                    ${Object.keys(estoque).map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
                <p>Estoque: <span id="status-${idUnico}">${Object.values(estoque)[0]}</span></p>
                <button class="btn-adicionar" onclick="adicionarAoCarrinho('${p.id}', '${prefixo}', ${usarPromo})">Adicionar</button>
            </div>`;
        container.appendChild(cartao);
    });
}

function atualizarStatusEstoque(id, prefixo, promo) {
    const p = dadosProdutosFiltrados.find(x => x.id === id);
    const cor = document.getElementById(`cor-${prefixo}-${id}`).value;
    document.getElementById(`status-${prefixo}-${id}`).innerText = (promo ? p.estoquePromocional : p.estoquePorCor)[cor];
}

function toggleCarrinhoMobile() { document.getElementById("carrinho-gaveta").classList.toggle("aberto"); }

function adicionarAoCarrinho(id, prefixo, promo) {
    const p = dadosProdutosFiltrados.find(x => x.id === id);
    const cor = document.getElementById(`cor-${prefixo}-${id}`).value;
    carrinho.push({ id, nome: p.nome, cor, qtd: 1, promo });
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const container = document.getElementById("itens-carrinho");
    const badge = document.getElementById("badge-contador-carrinho");
    badge.innerText = carrinho.length;
    container.innerHTML = carrinho.map((i, idx) => `<div class="item-carrinho-linha">${i.nome} (${i.cor}) <button onclick="removerDoCarrinho(${idx})">X</button></div>`).join('');
    document.getElementById("btn-confirmar").disabled = carrinho.length === 0;
}

function removerDoCarrinho(idx) { carrinho.splice(idx, 1); atualizarInterfaceCarrinho(); }

async function confirmarBaixa() {
    alert("Transmissão realizada!");
    carrinho = [];
    atualizarInterfaceCarrinho();
    toggleCarrinhoMobile();
}
