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
    if (listaProdutos.length === 0) {
        listaDiv.innerHTML = "<p class='carrinho-vazio'>Nenhum modelo disponível.</p>";
        return;
    }
    listaProdutos.forEach(produto => {
        const idUnicoControle = `${prefixoContexto}-${produto.id}`;
        if (indicesImagens[idUnicoControle] === undefined) indicesImagens[idUnicoControle] = 0;
        const mapaEstoqueAlvo = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
        if (!mapaEstoqueAlvo) return;
        const coresTotais = Object.keys(mapaEstoqueAlvo);
        const coresDisponiveis = usarEstoquePromo ? coresTotais.filter(cor => (mapaEstoqueAlvo[cor] || 0) > 0) : coresTotais;
        if (coresDisponiveis.length === 0) return;
        const primeiraCor = coresDisponiveis[0] || "Padrão";
        const estoqueInicial = mapaEstoqueAlvo[primeiraCor] || 0;
        const mapaImagensAlvo = (usarEstoquePromo && produto.imagemPromoPorCor) ? produto.imagemPromoPorCor : produto.imagemPorCor;
        const urlImagemInicial = mapaImagensAlvo ? mapaImagensAlvo[primeiraCor] : "";
        let indiceInicialEncontrado = 0;
        if (urlImagemInicial && produto.imagens) {
            const idx = produto.imagens.findIndex(url => url === urlImagemInicial || urlImagemInicial.includes(url) || url.includes(urlImagemInicial));
            if (idx !== -1) { indiceInicialEncontrado = idx; indicesImagens[idUnicoControle] = idx; }
        }
        let imagensHTML = "";
        if (produto.imagens && produto.imagens.length > 0) {
            produto.imagens.forEach((url, index) => {
                const classeAtiva = (index === indiceInicialEncontrado) ? 'ativa' : '';
                imagensHTML += `<img src="${url}" class="${classeAtiva}" data-index="${index}" alt="${produto.nome}">`;
            });
        } else {
            imagensHTML += `<img src="https://placehold.co/400x400?text=Sem+Foto" class="ativa" alt="Sem Foto">`;
        }
        let botoesCarrossel = "";
        if (produto.imagens && produto.imagens.length > 1) {
            botoesCarrossel = `<button class="btn-carrossel btn-prev" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, -1)">&#10094;</button><button class="btn-carrossel btn-next" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, 1)">&#10095;</button>`;
        }
        let coresOpcoes = "";
        coresDisponiveis.forEach(cor => { coresOpcoes += `<option value="${cor}">${cor}</option>`; });
        const tagPromoHTML = usarEstoquePromo ? `<div style="position: absolute; top: 10px; left: 10px; background-color: var(--cor-erro); color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; z-index: 3; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">Promoção</div>` : '';
        const nomeFormatado = produto.nome.replace("#", "").trim();
        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnicoControle}">${tagPromoHTML}${imagensHTML}${botoesCarrossel}</div>
            <div class="info-produto">
                <h3>${nomeFormatado}</h3>
                <div class="seletor-grupo">
                    <label>Selecione a Cor / Tamanho:</label>
                    <select id="cor-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">${coresOpcoes}</select>
                </div>
                <p class="estoque-status ${estoqueInicial === 0 ? 'sem-estoque' : ''}" id="status-${idUnicoControle}">${usarEstoquePromo ? 'Estoque Promo: ' : 'Estoque disponível: '}<span>${estoqueInicial}</span> un.</p>
            </div>
            <button class="btn-adicionar" id="btn-add-${idUnicoControle}" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">Selecionar Peça</button>
        `;
        listaDiv.appendChild(cartao);
    });
}

function atualizarStatusEstoque(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;
    const seletorCor = document.getElementById(`cor-${idUnicoControle}`);
    if (!seletorCor) return;
    const corSelecionada = seletorCor.value;
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
    if (!seletorCor) return;
    const corSelecionada = seletorCor.value;
    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const estoqueMaximo = mapaEstoque[corSelecionada] || 0;
    const itemExistente = carrinho.find(item => String(item.id) === String(produtoId) && item.corSelecionada === corSelecionada && item.promocional === usarEstoquePromo);
    const nomeLimpo = produto.nome.replace("#", "").trim();
    if (itemExistente) {
        if (itemExistente.quantidade < estoqueMaximo) itemExistente.quantidade++;
        else { alert(`Fim do estoque.`); return; }
    } else {
        const categoriaAtiva = produto.categoria || document.getElementById("filtro-categoria").value;
        carrinho.push({ id: produtoId, nome: nomeLimpo + (usarEstoquePromo ? " (PROMO)" : ""), corSelecionada, quantidade: 1, maximo: estoqueMaximo, promocional: usarEstoquePromo, categoriaOrigem: categoriaAtiva });
    }
    atualizarInterfaceCarrinho();
}

function silverwareDelete(index) { carrinho.splice(index, 1); atualizarInterfaceCarrinho(); }
function BlackQuantidadeCarrinho(index, alteracao) { alterarQuantidadeCarrinho(index, alteracao); }
function alterarQuantidadeCarrinho(index, alteracao) {
    const item = carrinho[index];
    if (!item) return;
    const novaQtd = item.quantidade + alteracao;
    if (novaQtd <= 0) carrinho.splice(index, 1);
    else if (novaQtd <= item.maximo) item.quantidade = novaQtd;
    else alert("Quantidade excede o estoque disponível.");
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const containerMobile = document.getElementById("itens-carrinho");
    const btnConfirmarMobile = document.getElementById("btn-confirmar");
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    const elementoBadgeMb = document.getElementById("contador-Abas");    
    const elementoBadgePc = document.getElementById("contador-topo");  
    if (elementoBadgeMb) elementoBadgeMb.innerText = totalItens;
    if (elementoBadgePc) elementoBadgePc.innerText = totalItens;
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
            linha.innerHTML = `<div><strong>${item.nome}</strong><br><small>${item.categoriaOrigem} (${item.corSelecionada})</small></div><div style="display:flex; align-items:center; gap:5px;"><button onclick="alterarQuantidadeCarrinho(${index}, -1)">-</button><span style="font-weight: bold; min-width:20px; text-align:center;">${item.quantidade}</span><button onclick="alterarQuantidadeCarrinho(${index}, 1)">+</button></div><button style="background-color: #ff4d4d; color: white;" onclick="silverwareDelete(${index})">Excluir</button>`;
            containerMobile.appendChild(linha);
        });
    }
    if (btnConfirmarMobile) btnConfirmarMobile.disabled = false;
}

async function confirmarBaixa() {
    const elementoDestino = document.getElementById("select-destino");
    if (!elementoDestino) return;
    const localizacao = elementoDestino.value;
    const btnConfirmar = document.getElementById("btn-confirmar");
    if (carrinho.length === 0) return;
    if (!confirm(`Confirmar a retirada destes itens para: ${localizacao}?`)) return;
    if (btnConfirmar) { btnConfirmar.innerText = "Processando..."; btnConfirmar.disabled = true; }
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
            alert("Baixa processada com sucesso!");
            carrinho = [];
            alternarSidebarCarrinho(false);
            atualizarInterfaceCarrinho();
            filtrarPorCategoria();
        } else {
            throw new Error(resultado.erro);
        }
    } catch (erro) {
        console.error("Erro na baixa:", erro);
        alert("Erro ao processar: " + erro.message);
    } finally {
        if (btnConfirmar) { btnConfirmar.innerText = "Confirmar"; btnConfirmar.disabled = false; }
    }
}
