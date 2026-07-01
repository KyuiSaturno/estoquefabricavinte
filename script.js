// Mantenha aqui a sua URL do Apps Script gerada no seu painel
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais do sistema
let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];       
let indicesImagens = {}; 

// --- FUNÇÃO CENTRALIZADA DE FETCH COM TENTATIVAS (BLINDAGEM CONTRA ERROS) ---
async function fetchComRetry(dados, tentativas = 3) {
    const params = new URLSearchParams();
    params.append("dados", JSON.stringify(dados));

    for (let i = 0; i < tentativas; i++) {
        try {
            const resposta = await fetch(WEB_APP_URL, {
                method: "POST",
                body: params,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            if (!resposta.ok) throw new Error(`Status HTTP: ${resposta.status}`);

            // Verifica se o conteúdo é JSON (evita o erro do Doctype/HTML)
            const contentType = resposta.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("O servidor retornou uma página (erro 404 ou página de login) em vez de dados.");
            }

            return await resposta.json();
        } catch (erro) {
            console.warn(`Tentativa ${i + 1} falhou: ${erro.message}`);
            if (i === tentativas - 1) throw erro; 
            await new Promise(r => setTimeout(r, 1500)); 
        }
    }
}

// ==========================================
// EXECUTA ASSIM QUE A PÁGINA CARREGA
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    configurarEstadoInicialVisual();

    const btnLoginSubmit = document.getElementById("btn-login");
    if (btnLoginSubmit) btnLoginSubmit.addEventListener("click", fazerLogin);

    const btnCarrinhoTopo = document.getElementById("btn-carrinho-topo");
    if (btnCarrinhoTopo) {
        btnCarrinhoTopo.addEventListener("click", () => {
            if (window.innerWidth > 768) alternarSidebarCarrinho(true);
            else alternarAbaSistemas('carrinho');
        });
    }

    const btnFecharCarrinho = document.getElementById("btn-fechar-carrinho");
    if (btnFecharCarrinho) btnFecharCarrinho.addEventListener("click", () => alternarSidebarCarrinho(false));

    const overlayCarrinho = document.getElementById("overlay-carrinho");
    if (overlayCarrinho) overlayCarrinho.addEventListener("click", () => alternarSidebarCarrinho(false));

    const btnNavProdutos = document.getElementById("btn-nav-produtos");
    if (btnNavProdutos) btnNavProdutos.addEventListener("click", () => alternarAbaSistemas('produtos'));

    const btnNavCarrinho = document.getElementById("btn-nav-carrinho");
    if (btnNavCarrinho) btnNavCarrinho.addEventListener("click", () => alternarAbaSistemas('carrinho'));

    const filtroCategoria = document.getElementById("filtro-categoria");
    if (filtroCategoria) filtroCategoria.addEventListener("change", filtrarPorCategoria);

    const filtroPromo = document.getElementById("filtro-promocional");
    if (filtroPromo) filtroPromo.addEventListener("change", aplicarFiltroVisual);

    const btnConfirmar = document.getElementById("btn-confirmar");
    if (btnConfirmar) btnConfirmar.addEventListener("click", confirmarBaixa);

    const btnSair = document.getElementById("btn-sair");
    if (btnSair) btnSair.addEventListener("click", fazerLogout);

    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            const abaProdutos = document.getElementById("aba-produtos");
            const abaCarrinho = document.getElementById("aba-carrinho");
            if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
            if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
            const navMobile = document.getElementById("nav-mobile-sistema");
            if (navMobile) navMobile.classList.add("escondido");
        } else {
            alternarSidebarCarrinho(false);
            if (usuarioLogado) {
                const navMobile = document.getElementById("nav-mobile-sistema");
                if (navMobile) navMobile.classList.remove("escondido");
            }
        }
    });
});

function configurarEstadoInicialVisual() {
    alternarSidebarCarrinho(false);
    
    const telaLogin = document.getElementById("tela-login");
    const painelPrincipal = document.getElementById("painel-principal");
    const navMobile = document.getElementById("nav-mobile-sistema");

    if (!document.getElementById("estilo-login-custom")) {
        const estilo = document.createElement("style");
        estilo.id = "estilo-login-custom";
        estilo.innerHTML = `
            #tela-login { display: flex !important; align-items: center; justify-content: center; min-height: 100vh; background-color: #121212; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 20px; box-sizing: border-box; }
            #tela-login .container, #tela-login .login-box, .box-login, #tela-login > div:not(.escondido) { background: #1e1e1e; padding: 40px 30px; border-radius: 12px; border: 1px solid #2d2d2d; box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4); width: 100%; max-width: 380px; text-align: center; box-sizing: border-box; }
            #tela-login h2, #tela-login h1 { color: #ffffff; font-size: 26px; margin-top: 0; margin-bottom: 30px; font-weight: 700; letter-spacing: 0.5px; }
            #tela-login .form-grupo, #tela-login div { margin-bottom: 20px; text-align: left; }
            #tela-login label { display: block; color: #b3b3b3; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
            #tela-login input[type="text"], #tela-login input[type="password"] { width: 100%; padding: 12px 14px; border: 1px solid #3d3d3d; border-radius: 6px; font-size: 15px; color: #ffffff; background-color: #252525; box-sizing: border-box; transition: all 0.2s ease; }
            #tela-login input:focus { outline: none; border-color: #ffcc00; background-color: #2d2d2d; box-shadow: 0 0 0 2px rgba(255, 204, 0, 0.1); }
            #tela-login button { width: 100%; padding: 14px; background-color: transparent; color: #ffcc00; border: 1.5px solid #ffcc00; border-radius: 6px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: all 0.2s ease; margin-top: 10px; }
            #tela-login button:hover { background-color: #ffcc00; color: #121212; }
            #tela-login button:disabled { border-color: #555555; color: #555555; cursor: not-allowed; background-color: transparent; }
            #erro-login { color: #ff4d4d; font-size: 13px; margin-top: 15px; text-align: center; font-weight: 500; min-height: 18px; }
            .carrossel img { width: 100% !important; aspect-ratio: 1 / 1 !important; object-fit: cover !important; display: none; }
            .carrossel img.ativa { display: block !important; }
        `;
        document.head.appendChild(estilo);
    }

    if (telaLogin) { telaLogin.classList.remove("escondido"); telaLogin.style.display = ""; }
    if (painelPrincipal) painelPrincipal.classList.add("escondido");
    if (navMobile) navMobile.classList.add("escondido");
    
    const nomeOperador = document.getElementById("nome-operator");
    if (nomeOperador) nomeOperador.innerText = "Usuário: ";
}

function alternarAbaSistemas(abaDestino) {
    const abaProdutos = document.getElementById("aba-produtos");
    const abaCarrinho = document.getElementById("aba-carrinho");
    const btnMbProdutos = document.getElementById("btn-nav-produtos");
    const btnMbCarrinho = document.getElementById("btn-nav-carrinho");

    if (window.innerWidth <= 768) {
        alternarSidebarCarrinho(false);
        if (abaDestino === 'produtos') {
            if (abaProdutos) abaProdutos.classList.add("exibir-mobile");
            if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
            if (btnMbProdutos) btnMbProdutos.classList.add("ativa");
            if (btnMbCarrinho) btnMbCarrinho.classList.remove("ativa");
        } else if (abaDestino === 'carrinho') {
            if (abaCarrinho) abaCarrinho.classList.add("exibir-mobile");
            if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
            if (btnMbCarrinho) btnMbCarrinho.classList.add("ativa");
            if (btnMbProdutos) btnMbProdutos.classList.remove("ativa");
        }
    } 
}

function alternarSidebarCarrinho(abrir) {
    const sidebar = document.getElementById("aba-carrinho");
    const overlay = document.getElementById("overlay-carrinho");

    if (abrir === undefined && sidebar) abrir = !sidebar.classList.contains("aberta");

    if (window.innerWidth > 768) {
        if (abrir) {
            if (sidebar) sidebar.classList.add("aberta");
            if (overlay) overlay.classList.add("visivel");
        } else {
            if (sidebar) sidebar.classList.remove("aberta");
            if (overlay) overlay.classList.remove("visivel");
        }
    } else {
        if (sidebar) sidebar.classList.remove("aberta");
        if (overlay) overlay.classList.remove("visivel");
    }
}

function fazerLogout() {
    usuarioLogado = "";
    carrinho = [];
    dadosProdutosFiltrados = [];
    indicesImagens = {};
    const usuarioField = document.getElementById("usuario");
    const senhaField = document.getElementById("senha");
    if (usuarioField) usuarioField.value = "";
    if (senhaField) senhaField.value = "";
    const filtroCat = document.getElementById("filtro-categoria");
    if (filtroCat) filtroCat.innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
    const gridProd = document.getElementById("grid-produtos");
    if (gridProd) gridProd.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima para listar os modelos correspondentes.</p>';
    const painelPrincipal = document.getElementById("painel-principal");
    if (painelPrincipal) painelPrincipal.classList.add("escondido");
    const navMobile = document.getElementById("nav-mobile-sistema");
    if (navMobile) navMobile.classList.add("escondido");
    const telaLogin = document.getElementById("tela-login");
    if (telaLogin) telaLogin.classList.remove("escondido");
    const btnLogin = document.getElementById("btn-login");
    if (btnLogin) { btnLogin.innerText = "Entrar"; btnLogin.disabled = false; }
    const erroLogin = document.getElementById("erro-login");
    if (erroLogin) erroLogin.innerText = "";
    alternarSidebarCarrinho(false);
    atualizarInterfaceCarrinho();
}

async function fazerLogin() {
    const usuarioInput = document.getElementById("usuario").value.trim();
    const senhaInput = document.getElementById("senha").value.trim();
    const erroLogin = document.getElementById("erro-login");
    const btnLogin = document.getElementById("btn-login");

    if (!usuarioInput || !senhaInput) {
        if (erroLogin) erroLogin.innerText = "Preencha todos os campos.";
        return;
    }

    btnLogin.innerText = "Verificando...";
    btnLogin.disabled = true;

    try {
        const resultado = await fetchComRetry({
            acao: "login",
            usuario: usuarioInput,
            senha: senhaInput
        });

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            const nomeOperador = document.getElementById("nome-operador");
            if (nomeOperador) nomeOperador.innerText = `Usuário: ${usuarioLogado}`;
            const telaLogin = document.getElementById("tela-login");
            if (telaLogin) {
                telaLogin.classList.add("escondido");
                telaLogin.style.setProperty("display", "none", "important");
            }
            const painelPrincipal = document.getElementById("painel-principal");
            if (painelPrincipal) painelPrincipal.classList.remove("escondido");
            const navMobile = document.getElementById("nav-mobile-sistema");
            if (navMobile) navMobile.classList.toggle("escondido", window.innerWidth > 768);
            
            if (window.innerWidth > 768) {
                const abaProdutos = document.getElementById("aba-produtos");
                const abaCarrinho = document.getElementById("aba-carrinho");
                if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
                if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
                alternarSidebarCarrinho(false);
            } else {
                alternarAbaSistemas('produtos');
            }
            carregarCategoriasDinamicas();
        } else {
            throw new Error(resultado.erro || "Usuário ou senha incorretos.");
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        if (erroLogin) erroLogin.innerText = "Erro: " + erro.message;
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

async function carregarCategoriasDinamicas() {
    const seletor = document.getElementById("filtro-categoria");
    if (!seletor) return;
    try {
        const resultado = await fetchComRetry({ acao: "obterAbas" });
        if (resultado.sucesso) {
            seletor.innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
            resultado.abas.forEach(aba => {
                const opcao = document.createElement("option");
                opcao.value = aba; opcao.innerText = aba;
                seletor.appendChild(opcao);
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar categorias dinâmicas:", erro);
    }
}

async function filtrarPorCategoria() {
    const categoriaSelecionada = document.getElementById("filtro-categoria").value;
    const containerFiltrados = document.getElementById("grid-produtos");

    if (!categoriaSelecionada) {
        if (containerFiltrados) containerFiltrados.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima.</p>';
        return;
    }

    if (containerFiltrados) containerFiltrados.innerHTML = '<p class="carrinho-vazio">Filtrando...</p>';

    try {
        const resultado = await fetchComRetry({
            acao: "obterProdutos",
            tipo: categoriaSelecionada
        });

        if (resultado.sucesso) {
            dadosProdutosFiltrados = resultado.produtos.map(p => ({ ...p, categoria: p.categoria || categoriaSelecionada }));
            aplicarFiltroVisual();
        } else {
            throw new Error(resultado.erro);
        }
    } catch (erro) {
        console.error("Erro no filtro:", erro);
        if (containerFiltrados) containerFiltrados.innerHTML = `<p class="carrinho-vazio" style="color: red;">Erro: ${erro.message}</p>`;
    }
}

function aplicarFiltroVisual() {
    const filtroPromoCheckbox = document.getElementById("filtro-promocional");
    const apenasPromocionais = filtroPromoCheckbox ? filtroPromoCheckbox.checked : false;
    
    if (apenasPromocionais) {
        const produtosPromocionais = dadosProdutosFiltrados.filter(produto => {
            if (!produto.estoquePromocional) return false;
            return Object.values(produto.estoquePromocional).some(qtd => qtd > 0);
        });
        renderizarProdutos(produtosPromocionais, "grid-produtos", "produtos", true);
    } else {
        renderizarProdutos(dadosProdutosFiltrados, "grid-produtos", "produtos", false);
    }
}

function renderizarProdutos(listaProdutos, containerId, prefixoContexto, usarEstoquePromo = false) {
    const listaDiv = document.getElementById(containerId);
    if (!listaDiv) return;
    listaDiv.innerHTML = "";
    
    // Lista de categorias que recebem a opção de estampa
    const categoriasComEstampa = ["Camisas", "Regatas", "Machão"];

    listaProdutos.forEach(produto => {
        const idUnicoControle = `${prefixoContexto}-${produto.id}`;
        const cores = [...new Set(Object.keys(produto.estoquePorCor || {}).map(k => k.split(' (')[0]))];
        const tamanhos = produto.tamanhos || ["Único"];

        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";

        // Cria o bloco de estampa condicionalmente
        let htmlPersonalizacao = "";
        if (categoriasComEstampa.includes(produto.categoria)) {
            htmlPersonalizacao = `
                <div class="personalizacao-grupo" style="margin-top:15px; padding-top:10px; border-top: 1px solid #333;">
                    <label>Personalização:</label>
                    <select id="tipo-${idUnicoControle}" onchange="toggleEstampa('${idUnicoControle}', this.value)">
                        <option value="lisa">Lisa</option>
                        <option value="estampada">Estampada</option>
                    </select>
                    <button id="btn-est-${idUnicoControle}" class="escondido" onclick="abrirModalEstampas('${idUnicoControle}')">Escolher Estampa</button>
                    <div id="preview-est-${idUnicoControle}" data-nome-estampa="" style="margin-top:5px;"></div>
                </div>`;
        }

        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnicoControle}">
                <img src="${produto.imagens[0]}" alt="${produto.nome}" class="ativa">
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                
                <div class="seletor-grupo">
                    <label>Cor:</label>
                    <select id="cor-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                        ${cores.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>

                <div class="seletor-grupo">
                    <label>Tamanho:</label>
                    <select id="tam-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                        ${tamanhos.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>

                ${htmlPersonalizacao}
            </div>
            <button class="btn-adicionar" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">Selecionar Peça</button>
        `;
        listaDiv.appendChild(cartao);
        
        // Chamada inicial para garantir que a imagem correta apareça logo no carregamento
        atualizarStatusEstoque(produto.id, prefixoContexto, usarEstoquePromo);
    });
}

function atualizarStatusEstoque(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;

    const seletorCor = document.getElementById(`cor-${idUnicoControle}`);
    if (!seletorCor) return;
    const corSelecionada = seletorCor.value;

    // --- LÓGICA DE ESTOQUE ---
    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const qtdDisponivel = mapaEstoque[corSelecionada] || 0;
    const statusP = document.getElementById(`status-${idUnicoControle}`);
    const btnAdd = document.getElementById(`btn-add-${idUnicoControle}`);
    
    if (statusP) {
        const spanEstoque = statusP.querySelector("span");
        if (spanEstoque) spanEstoque.innerText = qtdDisponivel;
        statusP.classList.toggle("sem-estoque", qtdDisponivel === 0);
    }
    
    if (btnAdd) {
        btnAdd.innerText = qtdDisponivel === 0 ? "Esgotado" : "Selecionar Peça";
        btnAdd.disabled = (qtdDisponivel === 0);
    }

    // --- NOVA LÓGICA: ATUALIZAÇÃO DO TECIDO ---
    const tecidoP = document.getElementById(`tecido-${idUnicoControle}`);
    const mapaTecido = usarEstoquePromo ? produto.tecidoPromoPorCor : produto.tecidoPorCor;
    const novoTecido = mapaTecido[corSelecionada] || "N/A";
    if (tecidoP) {
        tecidoP.innerText = novoTecido;
    }

    // --- LÓGICA DE IMAGENS ---
    const mapaImagensAlvo = (usarEstoquePromo && produto.imagemPromoPorCor) ? produto.imagemPromoPorCor : produto.imagemPorCor;
    const urlImagemCor = mapaImagensAlvo ? mapaImagensAlvo[corSelecionada] : "";
    if (urlImagemCor) {
        const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
        if (carrosselDiv) {
            const images = carrosselDiv.querySelectorAll("img");
            images.forEach((img, index) => {
                const srcAtual = img.getAttribute('src');
                if (srcAtual === urlImagemCor || urlImagemCor.includes(srcAtual) || srcAtual.includes(urlImagemCor)) {
                    images.forEach(i => i.classList.remove("ativa"));
                    img.classList.add("ativa");
                    indicesImagens[idUnicoControle] = index;
                }
            });
        }
    }
}

function mudarFoto(idUnicoControle, totalFotos, direcao) {
    indicesImagens[idUnicoControle] = (indicesImagens[idUnicoControle] + direcao + totalFotos) % totalFotos;
    const carrosselDiv = document.getElementById(`carrossel-${idUnicoControle}`);
    if (carrosselDiv) {
        const images = carrosselDiv.querySelectorAll("img");
        images.forEach(img => img.classList.remove("ativa"));
        if (images[indicesImagens[idUnicoControle]]) images[indicesImagens[idUnicoControle]].classList.add("ativa");
    }
}

function adicionarAoCarrinho(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;

    const seletorCor = document.getElementById(`cor-${idUnicoControle}`);
    const seletorTam = document.getElementById(`tam-${idUnicoControle}`);
    if (!seletorCor || !seletorTam) return;

    const corSelecionada = seletorCor.value;
    const tamSelecionado = seletorTam.value;
    const previewEstampa = document.getElementById(`preview-est-${idUnicoControle}`);
    const nomeEstampa = previewEstampa ? previewEstampa.dataset.nomeEstampa || "" : "";
    
    // Identificador único no carrinho baseado em ID + COR + TAM + ESTAMPA
    const chaveItem = `${produtoId}-${corSelecionada}-${tamSelecionado}-${nomeEstampa}-${usarEstoquePromo}`;
    const itemExistente = carrinho.find(item => item.chave === chaveItem);

    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ 
            chave: chaveItem,
            id: produtoId, 
            nome: produto.nome.replace("#", "").trim(), 
            corSelecionada, 
            tamanho: tamSelecionado,
            quantidade: 1, 
            promocional: usarEstoquePromo, 
            categoriaOrigem: produto.categoria,
            nomeEstampa: nomeEstampa
        });
    }
    atualizarInterfaceCarrinho();
}

function removerEstampaDoCarrinho(index) {
    carrinho[index].nomeEstampa = "";
    atualizarInterfaceCarrinho();
}

function silverwareDelete(index) { carrinho.splice(index, 1); atualizarInterfaceCarrinho(); }

function alterarQuantidadeCarrinho(index, alteracao) {
    const item = carrinho[index];
    if (!item) return;
    item.quantidade += alteracao;
    if (item.quantidade <= 0) carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const containerMobile = document.getElementById("itens-carrinho");
    const btnConfirmarMobile = document.getElementById("btn-confirmar");
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    
    const badgeAbas = document.getElementById("contador-Abas");
if (badgeAbas) {
    badgeAbas.innerText = totalItens;
}

const badgeTopo = document.getElementById("contador-topo");
if (badgeTopo) {
    badgeTopo.innerText = totalItens;
}

    if (carrinho.length === 0) {
        if (containerMobile) containerMobile.innerHTML = '<p class="carrinho-vazio">Nenhum item selecionado.</p>';
        if (btnConfirmarMobile) btnConfirmarMobile.disabled = true;
        return;
    }

    if (containerMobile) {
        containerMobile.innerHTML = "";
        carrinho.forEach((item, index) => {
            const linha = document.createElement("div");
            linha.className = "item-carrinho-linha";
            linha.innerHTML = `
                <div>
                    <strong>${item.nome}</strong><br>
                    <small>${item.categoriaOrigem} | ${item.corSelecionada} | Tam: ${item.tamanho}</small>
                    ${item.nomeEstampa ? `
                        <div style="font-size:11px; color:blue; margin-top:2px;">
                            Estampa: ${item.nomeEstampa} 
                            <button onclick="removerEstampaDoCarrinho(${index})" style="border:none; cursor:pointer; color:red;">[X]</button>
                        </div>` : ''}
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button onclick="alterarQuantidadeCarrinho(${index}, -1)">-</button>
                    <span>${item.quantidade}</span>
                    <button onclick="alterarQuantidadeCarrinho(${index}, 1)">+</button>
                </div>
                <button style="background-color: #ff4d4d; color: white;" onclick="silverwareDelete(${index})">Excluir</button>
            `;
            containerMobile.appendChild(linha);
        });
    }
    if (btnConfirmarMobile) btnConfirmarMobile.disabled = false;
}

async function confirmarBaixa() {
    const localizacao = document.getElementById("select-destino")?.value;
    if (!localizacao || carrinho.length === 0) return;
    if (!confirm(`Confirmar retirada para: ${localizacao}?`)) return;

    const btn = document.getElementById("btn-confirmar");
    btn.innerText = "Processando...";
    btn.disabled = true;

    try {
        const resultado = await fetchComRetry({
            acao: "darBaixa",
            tipo: carrinho[0].categoriaOrigem,
            usuario: usuarioLogado,
            localizacao: localizacao,
            isPromo: carrinho[0].promocional, 
            carrinho: carrinho 
        });

        if (resultado.sucesso) {
            alert("Baixa processada!");
            carrinho = [];
            atualizarInterfaceCarrinho();
            filtrarPorCategoria();
        } else {
            throw new Error(resultado.erro);
        }
    } catch (erro) {
        alert("Erro: " + erro.message);
    } finally {
        btn.innerText = "Confirmar";
        btn.disabled = false;
    }
}

// Funções de Estampa
function toggleEstampa(id, valor) {
    document.getElementById(`btn-est-${id}`).classList.toggle("escondido", valor !== "estampada");
}

async function abrirModalEstampas(id) {
    const res = await fetchComRetry({ acao: "obterEstampas" });
    const grid = document.getElementById("grid-estampas");
    grid.innerHTML = res.estampas.map(est => `
        <div style="cursor:pointer;" onclick="selecionarEstampa('${id}', '${est.nome}', '${est.url}')">
            <img src="${est.url}" style="width:100%; border-radius:8px;">
            <p style="font-size:12px; text-align:center;">${est.nome}</p>
        </div>`).join('');
    document.getElementById("modal-estampas").classList.remove("escondido");
}

function selecionarEstampa(idControle, nome, url) {
    const preview = document.getElementById(`preview-est-${idControle}`);
    preview.dataset.nomeEstampa = nome;
    preview.innerHTML = `
        <div class="item-estampa-selecionada" style="display:flex; align-items:center; justify-content:space-between; background:#222; padding:8px; border-radius:4px; border:1px solid #444;">
            <div style="display:flex; align-items:center; gap:8px;">
                <img src="${url}" style="width:30px; height:30px; border-radius:3px;">
                <small style="color:#fff;">${nome}</small>
            </div>
            <button onclick="removerEstampa('${idControle}')" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer; font-weight:bold;">X</button>
        </div>`;
    document.getElementById("modal-estampas").classList.add("escondido");
}

function removerEstampa(idControle) {
    const preview = document.getElementById(`preview-est-${idControle}`);
    preview.dataset.nomeEstampa = "";
    preview.innerHTML = "";
    document.getElementById(`tipo-${idControle}`).value = "lisa";
    document.getElementById(`btn-est-${idControle}`).classList.add("escondido");
}

function atualizarStatusEstoque(idUnicoControle) {
    // 1. O idUnicoControle é algo como "Camisas-ID123". 
    // Precisamos extrair apenas o "ID123" para buscar na lista.
    const partes = idUnicoControle.split('-');
    const produtoId = partes[partes.length - 1]; // Pega o último elemento (o ID real)

    // 2. Busca o produto
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;

    // 3. Pega os valores selecionados
    const cor = document.getElementById(`cor-${idUnicoControle}`).value;
    const tam = document.getElementById(`tam-${idUnicoControle}`).value;
    
    // 4. Monta a chave igual ao formato que criamos no Código.gs
    const chave = `${cor} (${tam})`;
    
    // 5. Busca o estoque e atualiza a interface
    const qtd = (produto.estoquePorCor && produto.estoquePorCor[chave]) ? produto.estoquePorCor[chave] : 0;
    
    const elementoStatus = document.getElementById(`status-${idUnicoControle}`);
    if (elementoStatus) {
        elementoStatus.innerHTML = `Estoque disponível: <span>${qtd}</span> un.`;
        // Adiciona uma classe visual se estiver esgotado
        elementoStatus.className = `estoque-status ${qtd === 0 ? 'sem-estoque' : ''}`;
    }
}
