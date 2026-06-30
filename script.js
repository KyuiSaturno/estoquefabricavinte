// Mantenha aqui a sua URL do Apps Script gerada no último passo
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbz5wtsSda51rruXfp6k2vgu3Oj7FuP_uNJqnJypJ_ft8FC9OToInhlO7PmGF4XZbOij/exec";

// Variáveis globais do sistema
let usuarioLogado = "";
let dadosProdutosFiltrados = []; 
let carrinho = [];      
let indicesImagens = {}; 

// EXECUTA ASSIM QUE A PÁGINA CARREGA
document.addEventListener("DOMContentLoaded", () => {
    // Garante que o carrinho comece fechado no carregamento
    alternarSidebarCarrinho(false);

    // Ouvintes de clique para abrir/fechar a Sidebar no PC
    const btnCarrinhoTopo = document.getElementById("btn-carrinho-topo");
    if (btnCarrinhoTopo) {
        btnCarrinhoTopo.addEventListener("click", () => {
            if (window.innerWidth > 768) {
                alternarSidebarCarrinho(true);
            } else {
                alternarAbaSistemas('carrinho');
            }
        });
    }

    const btnFecharCarrinho = document.getElementById("btn-fechar-carrinho");
    if (btnFecharCarrinho) {
        btnFecharCarrinho.addEventListener("click", () => alternarSidebarCarrinho(false));
    }

    const overlayCarrinho = document.getElementById("overlay-carrinho");
    if (overlayCarrinho) {
        overlayCarrinho.addEventListener("click", () => alternarSidebarCarrinho(false));
    }

    // Ouvintes de clique para a navegação inferior (Mobile)
    const btnNavProdutos = document.getElementById("btn-nav-produtos");
    if (btnNavProdutos) {
        btnNavProdutos.addEventListener("click", () => alternarAbaSistemas('produtos'));
    }

    const btnNavCarrinho = document.getElementById("btn-nav-carrinho");
    if (btnNavCarrinho) {
        btnNavCarrinho.addEventListener("click", () => alternarAbaSistemas('carrinho'));
    }

    // Gatilho para monitorar mudanças no seletor de Categoria
    const filtroCategoria = document.getElementById("filtro-categoria");
    if (filtroCategoria) {
        filtroCategoria.addEventListener("change", filtrarPorCategoria);
    }

    // Gatilho para o Checkbox Promocional
    const filtroPromo = document.getElementById("filtro-promocional");
    if (filtroPromo) {
        filtroPromo.addEventListener("change", aplicarFiltroVisual);
    }

    // Gatilho para o botão de confirmação de Baixa
    const btnConfirmar = document.getElementById("btn-confirmar");
    if (btnConfirmar) {
        btnConfirmar.addEventListener("click", confirmarBaixa);
    }

    // Gatilho para o botão Sair
    const btnSair = document.getElementById("btn-sair");
    if (btnSair) {
        btnSair.addEventListener("click", fazerLogout);
    }

    // Ouvinte preventivo para redimensionamento de janela dinâmico
    window.addEventListener("resize", () => {
        if (window.innerWidth > 768) {
            const abaProdutos = document.getElementById("aba-produtos");
            const abaCarrinho = document.getElementById("aba-carrinho");
            if (abaProdutos) abaProdutos.classList.remove("exibir-mobile");
            if (abaCarrinho) abaCarrinho.classList.remove("exibir-mobile");
        } else {
            alternarSidebarCarrinho(false);
        }
    });
});

// ==========================================
// CONTROLADOR DE NAVEGAÇÃO E SIDEBAR (GAVETA)
// ==========================================
function alternarAbaSistemas(abaDestino) {
    const abaProdutos = document.getElementById("aba-produtos");
    const abaCarrinho = document.getElementById("aba-carrinho");
    const btnMbProdutos = document.getElementById("btn-nav-produtos");
    const btnMbCarrinho = document.getElementById("btn-nav-carrinho");

    // EXECUÇÃO EM MODO CELULAR / MOBILE (Telas menores ou iguais a 768px)
    if (window.innerWidth <= 768) {
        // Garante que os efeitos visuais de desktop fiquem desativados no mobile
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

// Função unificada para controlar abertura, fechamento e overlay no desktop
function alternarSidebarCarrinho(abrir) {
    const sidebar = document.getElementById("aba-carrinho");
    const overlay = document.getElementById("overlay-carrinho");

    if (abrir === undefined && sidebar) {
        abrir = !sidebar.classList.contains("aberta");
    }

    if (window.innerWidth > 768) {
        if (abrir) {
            if (sidebar) sidebar.classList.add("aberta");
            if (overlay) overlay.classList.add("visivel");
        } else {
            if (sidebar) sidebar.classList.remove("aberta");
            if (overlay) overlay.classList.remove("visivel");
        }
    } else {
        // Fallback preventivo para evitar que trave classes residuais no mobile
        if (sidebar) sidebar.classList.remove("aberta");
        if (overlay) overlay.classList.remove("visivel");
    }
}

// Função de Saída Segura (Logout)
function fazerLogout() {
    usuarioLogado = "";
    carrinho = [];
    dadosProdutosFiltrados = [];
    indicesImagens = {};
    
    // Limpa campos visuais de formulários se existirem
    const usuarioField = document.getElementById("usuario");
    const senhaField = document.getElementById("senha");
    if (usuarioField) usuarioField.value = "";
    if (senhaField) senhaField.value = "";
    
    document.getElementById("filtro-categoria").innerHTML = '<option value="">-- Escolha uma Categoria --</option>';
    document.getElementById("grid-produtos").innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima para listar os modelos correspondentes.</p>';
    
    // Reseta visibilidade das telas
    document.getElementById("painel-principal").classList.add("escondido");
    
    const navMobile = document.getElementById("nav-mobile-sistema");
    if (navMobile) navMobile.classList.add("escondido");
    
    const telaLogin = document.getElementById("tela-login");
    if (telaLogin) telaLogin.classList.remove("escondido");
    
    const btnLogin = document.getElementById("btn-login");
    if (btnLogin) {
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
    
    alternarSidebarCarrinho(false);
    atualizarInterfaceCarrinho();
}

// ==========================================
// INTERFACE DE LOGIN E CARREGAMENTO INICIAL
// ==========================================
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
    if (erroLogin) erroLogin.innerText = "";

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({
            acao: "login",
            usuario: usuarioInput,
            senha: senhaInput
        }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            usuarioLogado = usuarioInput;
            document.getElementById("nome-operador").innerText = `Usuário: ${usuarioLogado}`;
            
            document.getElementById("tela-login").classList.add("escondido");
            document.getElementById("painel-principal").classList.remove("escondido");
            
            const navMobile = document.getElementById("nav-mobile-sistema");
            if (navMobile) {
                navMobile.classList.remove("escondido");
            }
            
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
            if (erroLogin) erroLogin.innerText = resultado.erro || "Usuário ou senha incorretos.";
            btnLogin.innerText = "Entrar";
            btnLogin.disabled = false;
        }
    } catch (erro) {
        console.error("Erro no login:", erro);
        if (erroLogin) erroLogin.innerText = "Erro ao conectar com o servidor.";
        btnLogin.innerText = "Entrar";
        btnLogin.disabled = false;
    }
}

// ==========================================
// CONFIGURAÇÃO DO SELETOR DINÂMICO
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
            console.log("Categorias carregadas com sucesso:", resultado.abas);
        }
    } catch (erro) {
        console.error("Erro ao carregar categorias dinâmicas:", erro);
    }
}

// ==========================================
// FILTRAGEM E EXIBIÇÃO DE PRODUTOS
// ==========================================
async function filtrarPorCategoria() {
    const categoriaSelecionada = document.getElementById("filtro-categoria").value;
    const containerFiltrados = document.getElementById("grid-produtos");

    if (!categoriaSelecionada) {
        containerFiltrados.innerHTML = '<p class="carrinho-vazio">Selecione uma categoria acima para listar os modelos correspondentes.</p>';
        return;
    }

    containerFiltrados.innerHTML = '<p class="carrinho-vazio">Filtrando categoria no servidor...</p>';

    try {
        const params = new URLSearchParams();
        params.append("dados", JSON.stringify({
            acao: "obterProdutos",
            tipo: categoriaSelecionada
        }));

        const resposta = await fetch(WEB_APP_URL, {
            method: "POST",
            body: params,
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        const resultado = await resposta.json();

        if (resultado.sucesso) {
            dadosProdutosFiltrados = resultado.produtos;
            aplicarFiltroVisual();
        } else {
            containerFiltrados.innerHTML = `<p class="carrinho-vazio" style="color: var(--cor-erro);">Erro ao buscar categoria: ${resultado.erro}</p>`;
        }
    } catch (erro) {
        console.error("Erro no filtro:", erro);
        containerFiltrados.innerHTML = '<p class="carrinho-vazio" style="color: var(--cor-erro);">Erro de rede ao buscar categoria.</p>';
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
    listaDiv.innerHTML = "";

    if (listaProdutos.length === 0) {
        listaDiv.innerHTML = "<p class='carrinho-vazio'>Nenhum modelo cadastrado ou disponível para os filtros selecionados.</p>";
        return;
    }

    listaProdutos.forEach(produto => {
        const idUnicoControle = `${prefixoContexto}-${produto.id}`;
        
        if (indicesImagens[idUnicoControle] === undefined) {
            indicesImagens[idUnicoControle] = 0;
        }

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
            if (idx !== -1) {
                indiceInicialEncontrado = idx;
                indicesImagens[idUnicoControle] = idx;
            }
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
            botoesCarrossel = `
                <button class="btn-carrossel btn-prev" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, -1)">&#10094;</button>
                <button class="btn-carrossel btn-next" onclick="mudarFoto('${idUnicoControle}', ${produto.imagens.length}, 1)">&#10095;</button>
            `;
        }

        let coresOpcoes = "";
        coresDisponiveis.forEach(cor => {
            coresOpcoes += `<option value="${cor}">${cor}</option>`;
        });

        const tagPromoHTML = usarEstoquePromo ? `<div style="position: absolute; top: 10px; left: 10px; background-color: var(--cor-erro); color: white; padding: 4px 8px; font-size: 11px; font-weight: bold; border-radius: 4px; z-index: 3; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">Promoção</div>` : '';

        const cartao = document.createElement("div");
        cartao.className = "cartao-produto";
        cartao.innerHTML = `
            <div class="carrossel" id="carrossel-${idUnicoControle}">
                ${tagPromoHTML}
                ${imagensHTML}
                ${botoesCarrossel}
            </div>
            <div class="info-produto">
                <h3>${produto.nome}</h3>
                <div class="seletor-grupo">
                    <label>Selecione a Cor / Tamanho:</label>
                    <select id="cor-${idUnicoControle}" onchange="atualizarStatusEstoque('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})">
                        ${coresOpcoes}
                    </select>
                </div>
                <p class="estoque-status ${estoqueInicial === 0 ? 'sem-estoque' : ''}" id="status-${idUnicoControle}">
                    ${usarEstoquePromo ? 'Estoque Promo: ' : 'Estoque disponível: '}<span>${estoqueInicial}</span> un.
                </p>
            </div>
            <button class="btn-adicionar" id="btn-add-${idUnicoControle}" onclick="adicionarAoCarrinho('${produto.id}', '${prefixoContexto}', ${usarEstoquePromo})" ${estoqueInicial === 0 ? 'disabled' : ''}>
                ${estoqueInicial === 0 ? 'Esgotado' : 'Selecionar Peça'}
            </button>
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
        statusP.querySelector("span").innerText = qtdDisponivel;
        if (qtdDisponivel === 0) {
            statusP.classList.add("sem-estoque");
        } else {
            statusP.classList.remove("sem-estoque");
        }
    }
    
    if (btnAdd) {
        if (qtdDisponivel === 0) {
            btnAdd.innerText = "Esgotado";
            btnAdd.disabled = true;
        } else {
            btnAdd.innerText = "Selecionar Peça";
            btnAdd.disabled = false;
        }
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
        images[indicesImagens[idUnicoControle]].classList.add("ativa");
    }
}

// ==========================================
// REGRAS DO CARRINHO DE TRANSMISSÃO
// ==========================================
function adicionarAoCarrinho(produtoId, prefixoContexto, usarEstoquePromo = false) {
    const idUnicoControle = `${prefixoContexto}-${produtoId}`;
    const produto = dadosProdutosFiltrados.find(p => String(p.id) === String(produtoId));
    if (!produto) return;
    
    const corSelecionada = document.getElementById(`cor-${idUnicoControle}`).value;
    const mapaEstoque = usarEstoquePromo ? produto.estoquePromocional : produto.estoquePorCor;
    const estoqueMaximo = mapaEstoque[corSelecionada] || 0;

    const itemExistente = carrinho.find(item => String(item.id) === String(produtoId) && item.corSelecionada === corSelecionada && item.promocional === usarEstoquePromo);

    if (itemExistente) {
        if (itemExistente.quantidade < estoqueMaximo) {
            itemExistente.quantidade++;
        } else {
            alert(`Fim do estoque físico para esta variação.`);
            return;
        }
    } else {
        carrinho.push({
            id: produtoId,
            nome: produto.nome + (usarEstoquePromo ? " (PROMO)" : ""),
            corSelecionada: corSelecionada,
            quantidade: 1,
            maximo: estoqueMaximo,
            promocional: usarEstoquePromo,
            categoriaOrigem: produto.categoria || document.getElementById("filtro-categoria").value
        });
    }
    atualizarInterfaceCarrinho();
}

function silverwareDelete(index) {
    carrinho.splice(index, 1);
    atualizarInterfaceCarrinho();
}

function alterarQuantidadeCarrinho(index, alteracao) {
    const item = carrinho[index];
    const novaQtd = item.quantidade + alteracao;

    if (novaQtd <= 0) {
        carrinho.splice(index, 1);
    } else if (novaQtd <= item.maximo) {
        item.indigo = true;
        item.quantidade = novaQtd;
    } else {
        alert("A quantidade excede o estoque real disponível.");
    }
    atualizarInterfaceCarrinho();
}

function atualizarInterfaceCarrinho() {
    const containerMobile = document.getElementById("itens-carrinho");
    const btnConfirmarMobile = document.getElementById("btn-confirmar");

    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    
    const elementoBadgeMb = document.getElementById("contador-Abas");      
    const elementoBadgePc = document.getElementById("contador-topo");  

    if (elementoBadgeMb) {
        elementoBadgeMb.innerText = totalItens;
    }
    if (elementoBadgePc) {
        elementoBadgePc.innerText = totalItens;
    }

    const htmlVazio = '<p class="carrinho-vazio">Nenhum item selecionado.</p>';

    if (carrinho.length === 0) {
        if (containerMobile) containerMobile.innerHTML = htmlVazio;
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
                    <small>${item.categoriaOrigem} (${item.corSelecionada})</small>
                </div>
                <div style="display:flex; align-items:center; gap:5px;">
                    <button onclick="alterarQuantidadeCarrinho(${index}, -1)">-</button>
                    <span style="font-weight: bold; min-width:20px; text-align:center;">${item.quantidade}</span>
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
    const elementoDestino = document.getElementById("select-destino");
    if (!elementoDestino) return;
    
    const localizacao = elementoDestino.value;
    const btnConfirmar = document.getElementById("btn-confirmar");

    if (carrinho.length === 0) return;
    if (!confirm(`Confirmar a retirada destes itens para: ${localizacao}?`)) return;

    btnConfirmar.innerText = "Processando...";
    btnConfirmar.disabled = true;

    try {
        for (let item of carrinho) {
            const params = new URLSearchParams();
            params.append("dados", JSON.stringify({
                acao: "darBaixa",
                tipo: item.categoriaOrigem,
                usuario: usuarioLogado,
                localizacao: localizacao,
                isPromo: item.promocional, 
                carrinho: [item]
            }));

            const resposta = await fetch(WEB_APP_URL, {
                method: "POST",
                body: params,
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });
            await resposta.json();
        }

        alert("Baixa processada com sucesso!");
        carrinho = [];
        alternarSidebarCarrinho(false);
        atualizarInterfaceCarrinho();
        
        filtrarPorCategoria();

    } catch (erro) {
        console.error("Erro na baixa:", erro);
        alert("Erro crítico ao sincronizar os dados de saída.");
        if (btnConfirmar) {
            btnConfirmar.innerText = "Confirmar";
            btnConfirmar.disabled = false;
        }
    }
}
